import { NextResponse } from "next/server";
import {
  EventName,
  type EventEntity,
} from "@paddle/paddle-node-sdk";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { paddle } from "@/lib/paddle/server";

export const runtime = "nodejs";

const FREE_PAGE_LIMIT = 500;
const FREE_QUESTION_LIMIT = 10;

const PRO_PAGE_LIMIT = 5000;
const PRO_QUESTION_LIMIT = 100;

type PaddleCustomData = {
  userId?: string;

  purchaseType?:
    | "PRO_MONTHLY"
    | "PRO_YEARLY"
    | "PAGES_1000"
    | "PAGES_3000"
    | "PAGES_5000"
    | "QUESTIONS_100";

  plan?: "PRO" | null;

  billingCycle?:
    | "MONTHLY"
    | "YEARLY"
    | null;

  extraPages?: number | null;

  extraQuestions?: number | null;
};

type PaddleWebhookData = {
  id?: string;

  status?: string;

  customerId?: string | null;

  subscriptionId?:
    | string
    | null;

  nextBilledAt?:
    | string
    | null;

  currentBillingPeriod?: {
    startsAt?:
      | string
      | null;

    endsAt?:
      | string
      | null;
  } | null;

  items?: Array<{
    price?: {
      id?: string;
    } | null;
  }>;

  customData?:
    | PaddleCustomData
    | null;
};

function getWebhookSecrets(): string[] {
  const secrets = [
    process.env.PADDLE_WEBHOOK_SECRET,
    process.env.PADDLE_SIMULATION_WEBHOOK_SECRET,
  ].filter(
    (value): value is string =>
      Boolean(value?.trim())
  );

  const uniqueSecrets =
    Array.from(
      new Set(
        secrets.map(
          (value) => value.trim()
        )
      )
    );

  if (uniqueSecrets.length === 0) {
    throw new Error(
      "PADDLE_WEBHOOK_SECRET و PADDLE_SIMULATION_WEBHOOK_SECRET غير موجودين داخل ملف .env"
    );
  }

  return uniqueSecrets;
}

async function unmarshalPaddleWebhook(
  rawBody: string,
  signature: string
): Promise<EventEntity> {
  const secrets =
    getWebhookSecrets();

  let lastError: unknown = null;

  for (const secret of secrets) {
    try {
      return await paddle.webhooks.unmarshal(
        rawBody,
        secret,
        signature
      );
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    "Paddle webhook signature verification failed."
  );
}

function toDate(
  value:
    | string
    | Date
    | null
    | undefined
): Date | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function getCustomData(
  data: PaddleWebhookData
): PaddleCustomData {
  return (
    data.customData ?? {}
  );
}

function getPriceId(
  data: PaddleWebhookData
): string | null {
  return (
    data.items?.[0]?.price
      ?.id ?? null
  );
}

function getExtraPagesFromPurchaseType(
  purchaseType:
    PaddleCustomData["purchaseType"]
): number {
  switch (purchaseType) {
    case "PAGES_1000":
      return 1000;

    case "PAGES_3000":
      return 3000;

    case "PAGES_5000":
      return 5000;

    default:
      return 0;
  }
}
function getExtraQuestionsFromPurchaseType(
  purchaseType:
    PaddleCustomData["purchaseType"]
): number {
  switch (purchaseType) {
    case "QUESTIONS_100":
      return 100;

    default:
      return 0;
  }
}

function isProPurchase(
  purchaseType:
    PaddleCustomData["purchaseType"]
) {
  return (
    purchaseType ===
      "PRO_MONTHLY" ||
    purchaseType ===
      "PRO_YEARLY"
  );
}

async function processTransactionCompleted(
  transaction:
    Prisma.TransactionClient,

  data:
    PaddleWebhookData,

  occurredAt:
    Date
) {
  const customData =
    getCustomData(data);

  const userId =
    customData.userId;

  const purchaseType =
    customData.purchaseType;

  if (
    !userId ||
    !purchaseType
  ) {
    console.warn(
      "PADDLE TRANSACTION WITHOUT CUSTOM DATA:",
      {
        transactionId:
          data.id,
        customData,
      }
    );

    return;
  }

  const extraPages =
  getExtraPagesFromPurchaseType(
    purchaseType
  );

if (extraPages > 0) {
  await transaction.subscription.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      plan: "FREE",

      monthlyLimit: 0,
      usedThisMonth: 0,
      extraCredits: 0,

      pageLimit:
        FREE_PAGE_LIMIT,

      usedPages: 0,

      extraPages,

      questionLimit:
        FREE_QUESTION_LIMIT,

      usedQuestions: 0,

      extraQuestions: 0,

      freeTrialUsed:
        false,

      paddleCustomerId:
        data.customerId ??
        null,

      paddleStatus:
        "active",

      lastPaddleEventAt:
        occurredAt,
    },

    update: {
      extraPages: {
        increment:
          extraPages,
      },

      paddleCustomerId:
        data.customerId ??
        undefined,

      lastPaddleEventAt:
        occurredAt,
    },
  });

  console.log(
    `Added ${extraPages} extra pages to user ${userId}`
  );

  return;
}

const extraQuestions =
  getExtraQuestionsFromPurchaseType(
    purchaseType
  );

if (extraQuestions > 0) {
  await transaction.subscription.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      plan: "FREE",

      monthlyLimit: 0,
      usedThisMonth: 0,
      extraCredits: 0,

      pageLimit:
        FREE_PAGE_LIMIT,

      usedPages: 0,

      extraPages: 0,

      questionLimit:
        FREE_QUESTION_LIMIT,

      usedQuestions: 0,

      extraQuestions,

      freeTrialUsed:
        false,

      paddleCustomerId:
        data.customerId ??
        null,

      paddleStatus:
        "active",

      lastPaddleEventAt:
        occurredAt,
    },

    update: {
      extraQuestions: {
        increment:
          extraQuestions,
      },

      paddleCustomerId:
        data.customerId ??
        undefined,

      lastPaddleEventAt:
        occurredAt,
    },
  });

  console.log(
    `Added ${extraQuestions} extra questions to user ${userId}`
  );

  return;
}

if (
  isProPurchase(
    purchaseType
  )
) {
    const extraQuestions =
  getExtraQuestionsFromPurchaseType(
    purchaseType
  );

if (extraQuestions > 0) {
  await transaction.subscription.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      plan: "FREE",

      monthlyLimit: 0,
      usedThisMonth: 0,
      extraCredits: 0,

      pageLimit:
        FREE_PAGE_LIMIT,

      usedPages: 0,

      extraPages: 0,

      questionLimit:
        FREE_QUESTION_LIMIT,

      usedQuestions: 0,

      extraQuestions,

      freeTrialUsed:
        false,

      paddleCustomerId:
        data.customerId ??
        null,

      paddleStatus:
        "active",

      lastPaddleEventAt:
        occurredAt,
    },

    update: {
      extraQuestions: {
        increment:
          extraQuestions,
      },

      paddleCustomerId:
        data.customerId ??
        undefined,

      lastPaddleEventAt:
        occurredAt,
    },
  });

  console.log(
    `Added ${extraQuestions} extra questions to user ${userId}`
  );

  return;
}
    const billingCycle =
      purchaseType ===
      "PRO_YEARLY"
        ? "YEARLY"
        : "MONTHLY";

    const expiresAt =
      toDate(
        data
          .currentBillingPeriod
          ?.endsAt
      ) ??
      toDate(
        data.nextBilledAt
      );

    await transaction.subscription.upsert({
      where: {
        userId,
      },

      create: {
        userId,

        plan: "PRO",

        monthlyLimit: 0,
        usedThisMonth: 0,
        extraCredits: 0,

        pageLimit:
          PRO_PAGE_LIMIT,

        usedPages: 0,

        extraPages: 0,

        questionLimit:
          PRO_QUESTION_LIMIT,

        usedQuestions: 0,

        extraQuestions: 0,

        freeTrialUsed:
          true,

        startsAt:
          new Date(),

        expiresAt,

        paddleCustomerId:
          data.customerId ??
          null,

        paddleSubscriptionId:
          data.subscriptionId ??
          null,

        paddlePriceId:
          getPriceId(data),

        paddleStatus:
          "active",

        billingCycle,

        lastPaddleEventAt:
          occurredAt,
      },

      update: {
        plan: "PRO",

        monthlyLimit: 0,
        usedThisMonth: 0,
        extraCredits: 0,

        pageLimit:
          PRO_PAGE_LIMIT,

        usedPages: 0,

        questionLimit:
          PRO_QUESTION_LIMIT,

        usedQuestions: 0,

        freeTrialUsed:
          true,

        startsAt:
          new Date(),

        expiresAt,

        paddleCustomerId:
          data.customerId ??
          undefined,

        paddleSubscriptionId:
          data.subscriptionId ??
          undefined,

        paddlePriceId:
          getPriceId(data) ??
          undefined,

        paddleStatus:
          "active",

        billingCycle,

        lastPaddleEventAt:
          occurredAt,
      },
    });

    console.log(
      `Activated PRO plan for user ${userId}`
    );
  }
}

async function processSubscriptionEvent(
  transaction:
    Prisma.TransactionClient,

  eventType:
    string,

  data:
    PaddleWebhookData,

  occurredAt:
    Date
) {
  const customData =
    getCustomData(data);

  const userId =
    customData.userId;

  if (!userId) {
    console.warn(
      "PADDLE SUBSCRIPTION WITHOUT USER ID:",
      {
        eventType,
        subscriptionId:
          data.id,
        customData,
      }
    );

    return;
  }

  const isCanceled =
    eventType ===
    EventName
      .SubscriptionCanceled;

  if (isCanceled) {
    await transaction.subscription.upsert({
      where: {
        userId,
      },

      create: {
        userId,

        plan: "FREE",

        monthlyLimit: 0,
        usedThisMonth: 0,
        extraCredits: 0,

        pageLimit: 0,
        usedPages: 0,
        extraPages: 0,

        questionLimit: 0,
        usedQuestions: 0,
        extraQuestions: 0,

        freeTrialUsed:
          true,

        paddleCustomerId:
          data.customerId ??
          null,

        paddleSubscriptionId:
          data.id ??
          null,

        paddlePriceId:
          getPriceId(data),

        paddleStatus:
          data.status ??
          "canceled",

        billingCycle:
          customData
            .billingCycle ??
          null,

        expiresAt:
          toDate(
            data
              .currentBillingPeriod
              ?.endsAt
          ) ??
          new Date(),

        lastPaddleEventAt:
          occurredAt,
      },

      update: {
        plan: "FREE",

        monthlyLimit: 0,
        usedThisMonth: 0,
        extraCredits: 0,

        pageLimit: 0,

        questionLimit: 0,

        freeTrialUsed:
          true,

        paddleCustomerId:
          data.customerId ??
          undefined,

        paddleSubscriptionId:
          data.id ??
          undefined,

        paddlePriceId:
          getPriceId(data) ??
          undefined,

        paddleStatus:
          data.status ??
          "canceled",

        billingCycle:
          customData
            .billingCycle ??
          undefined,

        expiresAt:
          toDate(
            data
              .currentBillingPeriod
              ?.endsAt
          ) ??
          new Date(),

        lastPaddleEventAt:
          occurredAt,
      },
    });

    console.log(
      `Canceled PRO subscription for user ${userId}`
    );

    return;
  }

  const startsAt =
    toDate(
      data
        .currentBillingPeriod
        ?.startsAt
    ) ??
    new Date();

  const expiresAt =
    toDate(
      data
        .currentBillingPeriod
        ?.endsAt
    ) ??
    toDate(
      data.nextBilledAt
    );

  const billingCycle =
    customData.billingCycle ??
    null;

  await transaction.subscription.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      plan: "PRO",

      monthlyLimit: 0,
      usedThisMonth: 0,
      extraCredits: 0,

      pageLimit:
        PRO_PAGE_LIMIT,

      usedPages: 0,

      extraPages: 0,

      questionLimit:
        PRO_QUESTION_LIMIT,

      usedQuestions: 0,

      extraQuestions: 0,

      freeTrialUsed:
        true,

      startsAt,

      expiresAt,

      paddleCustomerId:
        data.customerId ??
        null,

      paddleSubscriptionId:
        data.id ??
        null,

      paddlePriceId:
        getPriceId(data),

      paddleStatus:
        data.status ??
        "active",

      billingCycle,

      lastPaddleEventAt:
        occurredAt,
    },

    update: {
      plan: "PRO",

      monthlyLimit: 0,
      usedThisMonth: 0,
      extraCredits: 0,

      pageLimit:
        PRO_PAGE_LIMIT,


      questionLimit:
        PRO_QUESTION_LIMIT,


      freeTrialUsed:
        true,

      startsAt,

      expiresAt,

      paddleCustomerId:
        data.customerId ??
        undefined,

      paddleSubscriptionId:
        data.id ??
        undefined,

      paddlePriceId:
        getPriceId(data) ??
        undefined,

      paddleStatus:
        data.status ??
        "active",

      billingCycle:
        billingCycle ??
        undefined,

      lastPaddleEventAt:
        occurredAt,
    },
  });

  console.log(
    `Synced PRO subscription ${data.id} for user ${userId}`
  );
}


async function processSubscriptionPastDue(
  transaction:
    Prisma.TransactionClient,

  data:
    PaddleWebhookData,

  occurredAt:
    Date
) {
  const customData =
    getCustomData(data);

  const userId =
    customData.userId;

  const subscriptionId =
    data.id ?? null;

  let existingSubscription:
    Awaited<
      ReturnType<
        typeof transaction.subscription.findUnique
      >
    > = null;

  if (userId) {
    existingSubscription =
      await transaction.subscription.findUnique({
        where: {
          userId,
        },
      });
  }

  if (
    !existingSubscription &&
    subscriptionId
  ) {
    existingSubscription =
      await transaction.subscription.findFirst({
        where: {
          paddleSubscriptionId:
            subscriptionId,
        },
      });
  }

  if (!existingSubscription) {
    console.warn(
      "PADDLE PAST DUE SUBSCRIPTION NOT FOUND:",
      {
        userId,
        subscriptionId,
        customData,
      }
    );

    return;
  }

  await transaction.subscription.update({
    where: {
      userId:
        existingSubscription.userId,
    },

    data: {
      // Keep the customer on PRO while Paddle is
      // still trying to recover the payment.
      // Do NOT reset usage or grant a new allowance here.
      plan:
        existingSubscription.plan,

      paddleCustomerId:
        data.customerId ??
        undefined,

      paddleSubscriptionId:
        subscriptionId ??
        undefined,

      paddlePriceId:
        getPriceId(data) ??
        undefined,

      paddleStatus:
        data.status ??
        "past_due",

      billingCycle:
        customData.billingCycle ??
        undefined,

      lastPaddleEventAt:
        occurredAt,
    },
  });

  console.log(
    `Marked subscription as past_due for user ${existingSubscription.userId}`
  );
}

async function processWebhookEvent(
  event:
    EventEntity
) {
  const eventId =
    event.eventId;

  const eventType =
    event.eventType;

  const occurredAt =
    toDate(
      event.occurredAt
    ) ??
    new Date();

  const data =
    event.data as unknown as
      PaddleWebhookData;

  await prisma.$transaction(
    async (
      transaction
    ) => {
      await transaction
        .paddleWebhookEvent
        .create({
          data: {
            eventId,
            eventType,
            occurredAt,
          },
        });

      switch (eventType) {
        case EventName.TransactionCompleted:
          await processTransactionCompleted(
            transaction,
            data,
            occurredAt
          );
          break;

        case EventName.SubscriptionCreated:
        case EventName.SubscriptionActivated:
        case EventName.SubscriptionUpdated:
        case EventName.SubscriptionCanceled:
          await processSubscriptionEvent(
            transaction,
            eventType,
            data,
            occurredAt
          );
          break;

        case "subscription.past_due":
          await processSubscriptionPastDue(
            transaction,
            data,
            occurredAt
          );
          break;

        default:
          console.log(
            `Ignored Paddle event: ${eventType}`
          );
      }
    }
  );
}

export async function POST(
  request:
    Request
) {
  try {
    const signature =
      request.headers.get(
        "paddle-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Paddle signature header is missing.",
        },
        {
          status: 400,
        }
      );
    }

    const rawBody =
      await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          error:
            "Webhook body is empty.",
        },
        {
          status: 400,
        }
      );
    }

    const event =
      await unmarshalPaddleWebhook(
        rawBody,
        signature
      );

    try {
      await processWebhookEvent(
        event
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.log(
          `Duplicate Paddle event ignored: ${event.eventId}`
        );

        return NextResponse.json({
          received: true,
          duplicate: true,
        });
      }

      throw error;
    }

    return NextResponse.json({
      received: true,
      eventId:
        event.eventId,
      eventType:
        event.eventType,
    });
  } catch (error) {
    console.error(
      "PADDLE_WEBHOOK_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر التحقق من Webhook أو معالجته.",
      },
      {
        status: 400,
      }
    );
  }
}