import {
  initializePaddle,
  type Paddle,
} from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;
let paddlePromise: Promise<Paddle | undefined> | null = null;

export async function getPaddle(): Promise<
  Paddle | undefined
> {
  if (paddleInstance) {
    return paddleInstance;
  }

  if (paddlePromise) {
    return paddlePromise;
  }

  const clientToken =
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  if (!clientToken) {
    console.error(
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing."
    );

    return undefined;
  }

  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "production"
      : "sandbox";

  paddlePromise = initializePaddle({
    token: clientToken,
    environment,
    checkout: {
      settings: {
        displayMode: "overlay",
        theme: "dark",
        locale: "en",
      },
    },
    eventCallback: (event) => {
      console.log("PADDLE EVENT:", event);
    },
  })
    .then((paddle) => {
      paddleInstance = paddle;
      return paddle;
    })
    .catch((error) => {
      console.error(
        "PADDLE INITIALIZATION ERROR:",
        error
      );

      paddlePromise = null;
      return undefined;
    });

  return paddlePromise;
}