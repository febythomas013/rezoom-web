import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [experiences, education, certifications, projects, skills, leadership, languages] = await Promise.all([
    prisma.experience.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    prisma.education.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    prisma.certification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    prisma.project.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    prisma.skill.findMany({ where: { userId: session.userId } }),
    prisma.leadership.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    prisma.language.findMany({ where: { userId: session.userId } }),
  ]);

  return NextResponse.json({ experiences, education, certifications, projects, skills, leadership, languages });
}

// Default field values when creating a new record manually
const TABLE_DEFAULTS: Record<string, Record<string, unknown>> = {
  experience: { description: '', skills: [], metrics: [], source: 'manual' },
  education:  { source: 'resume' },
  certification: { source: 'manual' },
  project:    { description: '', skills: [], source: 'manual' },
  skill:      { source: 'manual' },
  leadership: { bullets: [], source: 'manual' },
  language:   { source: 'manual' },
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { table, data } = await req.json();
  const allowed = Object.keys(TABLE_DEFAULTS);
  if (!allowed.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[table] as { create: (args: unknown) => Promise<unknown> };
  const created = await model.create({
    data: { ...TABLE_DEFAULTS[table], ...data, userId: session.userId },
  });
  return NextResponse.json(created);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { table, id, data } = await req.json();
  const allowed = ['experience', 'education', 'certification', 'project', 'skill', 'leadership', 'language'];
  if (!allowed.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

  // Verify ownership before updating
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[table] as {
    findFirst: (args: unknown) => Promise<{ userId: string } | null>;
    update: (args: unknown) => Promise<unknown>;
  };
  const record = await model.findFirst({ where: { id, userId: session.userId } });
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await model.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { table, id } = await req.json();
  const allowed = ['experience', 'education', 'certification', 'project', 'skill', 'leadership', 'language'];
  if (!allowed.includes(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

  // Verify ownership before deleting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[table] as {
    findFirst: (args: unknown) => Promise<{ userId: string } | null>;
    delete: (args: unknown) => Promise<unknown>;
  };
  const record = await model.findFirst({ where: { id, userId: session.userId } });
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await model.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
