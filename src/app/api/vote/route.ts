import {
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  type ActionGetResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "@project/anchor";

import IDL from "@/../anchor/target/idl/voting.json";
import { BN, Program } from "@coral-xyz/anchor";

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    type: "action",
    icon: "https://makeitdairyfree.com/wp-content/uploads/2022/05/How-to-make-homemade-peanut-butter-1.jpg",
    title: "Vote for your favorite type of peanut butter",
    description: "Vote between Crunchy and Smooth peanut butter",
    label: "Vote",
    links: {
      actions: [
        {
          href: "/api/vote?candidate=Crunchy",
          label: "Vote for Crunchy",
          type: "transaction",
        },
        {
          href: "/api/vote?candidate=Smooth",
          label: "Vote for Smooth",
          type: "transaction",
        },
      ],
    },
  };

  return Response.json(actionMetadata, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const candidate = new URL(request.url).searchParams.get("candidate");

  if (candidate !== "Crunchy" && candidate !== "Smooth") {
    return Response.json("Invalid candidate", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const body: ActionPostRequest = await request.json();

  let voter: PublicKey;
  try {
    voter = new PublicKey(body.account);
  } catch (err) {
    return new Response("Invalid account", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const program: Program = new Program(IDL as any, { connection });
  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash,
    lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: { transaction, type: "transaction" },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
