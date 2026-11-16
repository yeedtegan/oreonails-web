"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Article, Pattern } from "@/lib/data";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { ArtEditor, Button, Card, ErrorNote, Field, PageHeader, SingleImage, inputCls, slugify, textareaCls } from "@/components/admin/ui";

interface Form {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string;
  body: string;
  image: string | null;
  palette: [string, string, string, string];
  pattern: Pattern;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ArticleEditor() {
  const { slug } = useParams<{ slug: string }>();
  const isNew = slug === "new";
  const router = useRouter();
  const { call, notify } = useAdmin();
  const { data: list, error: loadError } = useAdminData<{ articles: Article[] }>(isNew ? null : "/articles");
  const [f, setF] = useState<Form>({ slug: "", title: "", excerpt: "", date: today(), tags: "", body: "", image: null, palette: ["#f4ece4", "#1c1c1c", "#e8c7c1", "#ffffff"], pattern: "french" });
  const [loaded, setLoaded] = useState(isNew);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const a = list?.articles.find((x) => x.slug === slug);
    if (!a) return;
    setF({ slug: a.slug, title: a.title, excerpt: a.excerpt, date: a.date, tags: (a.tags ?? []).join(", "), body: (a.body ?? []).join("\n\n"), image: a.image ?? null, palette: a.palette, pattern: a.pattern });
    setLoaded(true);
  }, [list, slug]);

  const save = async () => {
    const s = isNew ? f.slug || slugify(f.title) : slug;
    if (!f.title.trim() || !s) return setErr("Title is required.");
    setErr("");
    setSaving(true);
    try {
      await call(`/articles/${s}`, {
        method: "PUT",
        body: {
          title: f.title.trim(),
          excerpt: f.excerpt,
          date: f.date,
          tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
          body: f.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
          image: f.image,
          palette: f.palette,
          pattern: f.pattern,
        },
      });
      notify(isNew ? "Article published" : "Article saved");
      if (isNew) router.replace(`/admin/articles/${s}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded && !loadError) return <p className="text-muted">Loading…</p>;

  return (
    <>
      <PageHeader
        title={isNew ? "New article" : f.title}
        subtitle={<Link href="/admin/articles" className="underline">← All articles</Link>}
        actions={
          <>
            {!isNew && <a href={`/blogs/nail-guide/${slug}`} target="_blank" rel="noreferrer"><Button>View ↗</Button></a>}
            <Button kind="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : isNew ? "Publish" : "Save"}</Button>
          </>
        }
      />
      <ErrorNote>{loadError || err}</ErrorNote>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="space-y-4">
            <Field label="Title">
              <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value, ...(isNew && { slug: slugify(e.target.value) }) })} />
            </Field>
            <Field label="Excerpt" hint="One or two sentences shown in listings">
              <textarea className={textareaCls.replace("min-h-[110px]", "min-h-[70px]")} value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} />
            </Field>
            <Field label="Body" hint="Separate paragraphs with a blank line">
              <textarea className={`${textareaCls} min-h-[380px] leading-relaxed`} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            </Field>
          </div>
        </Card>
        <div className="space-y-5">
          <Card title="Publishing">
            <div className="space-y-4">
              <Field label="URL slug" hint={`/blogs/nail-guide/${isNew ? f.slug || "…" : slug}`}>
                <input className={inputCls} value={isNew ? f.slug : slug} disabled={!isNew} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} />
              </Field>
              <Field label="Date">
                <input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
              </Field>
              <Field label="Tags" hint="Comma separated, e.g. How-To, Nail Care">
                <input className={inputCls} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
              </Field>
            </div>
          </Card>
          <Card title="Cover image">
            <SingleImage value={f.image} onChange={(v) => setF({ ...f, image: v })} />
          </Card>
          <Card title="Generated artwork">
            <ArtEditor palette={f.palette} pattern={f.pattern} onChange={(v) => setF({ ...f, ...v })} />
          </Card>
        </div>
      </div>
    </>
  );
}
