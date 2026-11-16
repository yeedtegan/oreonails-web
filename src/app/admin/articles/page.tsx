"use client";

import Link from "next/link";
import type { Article } from "@/lib/data";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Button, Empty, ErrorNote, PageHeader, Table } from "@/components/admin/ui";
import { ArticleArt } from "@/components/Art";

export default function ArticlesPage() {
  const { call, notify } = useAdmin();
  const { data, error, reload } = useAdminData<{ articles: Article[] }>("/articles");

  const remove = async (a: Article) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    try {
      await call(`/articles/${a.slug}`, { method: "DELETE" });
      notify("Article deleted");
      reload();
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Nail Guide" subtitle="Blog articles shown on the home page and /blogs/nail-guide." actions={<Link href="/admin/articles/new"><Button kind="primary">+ New article</Button></Link>} />
      <ErrorNote>{error}</ErrorNote>
      {data?.articles.length === 0 ? (
        <Empty>No articles yet.</Empty>
      ) : (
        <Table head={["", "Title", "Tags", "Date", ""]}>
          {data?.articles.map((a) => (
            <tr key={a.slug} className="hover:bg-[#fcfafb]">
              <td className="w-24 px-4 py-2.5"><div className="aspect-[16/9] w-20 overflow-hidden rounded-md"><ArticleArt article={a} className="h-full w-full" /></div></td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/articles/${a.slug}`} className="font-semibold hover:underline">{a.title}</Link>
                <span className="block text-[12px] text-muted">{a.excerpt}</span>
              </td>
              <td className="px-4 py-2.5 text-[12.5px] text-muted">{a.tags?.join(", ")}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted">{a.date}</td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                <a href={`/blogs/nail-guide/${a.slug}`} target="_blank" rel="noreferrer" className="mr-3 text-[13px] underline">View</a>
                <button onClick={() => remove(a)} className="text-[13px] text-[#b0263c] underline">Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
