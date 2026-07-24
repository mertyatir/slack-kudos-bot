// deno-lint-ignore-file no-explicit-any
export async function queryAllKudos(
  client: any,
  query: Record<string, unknown> = {},
): Promise<{ ok: boolean; error?: string; items: any[] }> {
  const items: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.apps.datastore.query({
      datastore: "kudos",
      limit: 1000,
      ...query,
      ...(cursor ? { cursor } : {}),
    });
    if (!res.ok) return { ok: false, error: res.error, items };
    items.push(...res.items);
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return { ok: true, items };
}
