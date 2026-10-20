import { polarClient } from "@/lib/polar";

type PolarCustomerState = Awaited<
  ReturnType<typeof polarClient.customers.getStateExternal>
>;

type PolarUser = {
  id: string;
  email: string;
  name?: string | null;
};

function isPolarResourceNotFound(error: unknown) {
  return error instanceof Error && error.name === "ResourceNotFound";
}

async function linkExistingCustomer(user: PolarUser) {
  const listed = await polarClient.customers.list({
    email: user.email,
    limit: 1,
  });
  const existing = listed.result.items[0];

  if (!existing) {
    return false;
  }

  if (existing.externalId === user.id) {
    return true;
  }

  if (existing.externalId) {
    return false;
  }

  await polarClient.customers.update({
    id: existing.id,
    customerUpdate: {
      externalId: user.id,
    },
  });

  return true;
}

async function ensurePolarCustomer(user: PolarUser) {
  try {
    await polarClient.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      externalId: user.id,
    });
    return;
  } catch (error) {
    if (isPolarResourceNotFound(error)) {
      return;
    }

    if (error instanceof Error && error.name !== "HTTPValidationError") {
      throw error;
    }
  }

  const linked = await linkExistingCustomer(user);

  if (!linked) {
    throw new Error(
      "No Polar customer is linked to this account. Confirm the deployed POLAR_ACCESS_TOKEN belongs to the same Polar organization (and sandbox or production) used at sign-up.",
    );
  }
}

export async function getPolarCustomerState(
  user: PolarUser,
): Promise<PolarCustomerState> {
  try {
    return await polarClient.customers.getStateExternal({
      externalId: user.id,
    });
  } catch (error) {
    if (!isPolarResourceNotFound(error)) {
      throw error;
    }
  }

  await ensurePolarCustomer(user);

  return polarClient.customers.getStateExternal({
    externalId: user.id,
  });
}
