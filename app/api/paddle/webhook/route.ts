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
    | "PAGES_5000";

  plan?: "PRO" | null;

  billingCycle?:
    | "MONTHLY"
    | "YEARLY"
    | null;

  extraPages?: number | null;
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

function getWebhookSecret(): string {
  const secret =
    process.env
      .PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "PADDLE_WEBHOOK_SECRET غير موجود داخل ملف .env"
    );
  }

  return secret;
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

  if (
    isProPurchase(
      purchaseType
    )
  ) {
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

      usedPages: 0,

      questionLimit:
        PRO_QUESTION_LIMIT,

      usedQuestions: 0,

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

    const webhookSecret =
      getWebhookSecret();

    const event =
      await paddle.webhooks.unmarshal(
        rawBody,
        webhookSecret,
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