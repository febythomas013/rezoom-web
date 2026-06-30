import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';

interface Role { title?: string; company?: string; location?: string; startDate?: string; endDate?: string; description?: string; skills?: string[]; }
interface Edu { degree?: string; institution?: string; year?: string; cgpa?: string; }
interface Leadership { title?: string; organization?: string; period?: string; location?: string; bullets?: string[]; }
interface Cert { name?: string; issuer?: string; issuedYear?: string; credentialUrl?: string; }
interface Proj { title?: string; description?: string; skills?: string[]; link?: string; }
interface Lang { language?: string; name?: string; proficiency?: string; }
interface ParsedResume {
  name?: string; email?: string; phone?: string; location?: string; linkedinUrl?: string; interests?: string;
  roles?: Role[]; education?: Edu[]; leadership?: Leadership[]; certifications?: Cert[]; projects?: Proj[];
  languages?: Lang[]; skills?: string[];
}

async function extractResumeFromPdf(pdfBase64: string): Promise<ParsedResume> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      'You are a resume parser. Extract ALL structured information from this resume PDF. Return ONLY a JSON object with: ' +
      'name (full name string or null), email (string or null), phone (string or null), location (string or null), linkedinUrl (string or null), ' +
      'roles (array of {title, company, location, startDate, endDate, description, skills}), ' +
      'education (array of {degree, institution, year, cgpa}), ' +
      'leadership (array of {title, organization, period, location, bullets}), ' +
      'certifications (array of {name, issuer, issuedYear, credentialUrl}), ' +
      'projects (array of {title, description, skills, link}), ' +
      'languages (array of {language, proficiency}), ' +
      'skills (string array), ' +
      'interests (string or null). ' +
      'Use empty arrays or null for sections not present. No preamble, no markdown, just the JSON object.',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: 'Parse this resume and return the structured JSON.' },
        ],
      },
    ],
  });

  const block = message.content[0];
  const raw = ('text' in block ? block.text : '').replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
  return JSON.parse(raw);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');

  const parsed = await extractResumeFromPdf(pdfBase64);
  const userId = session.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const experienceData = (parsed.roles || []).map((role) => ({
    userId,
    title: role.title || 'Role',
    company: role.company || null,
    location: role.location || null,
    period: [role.startDate, role.endDate].filter(Boolean).join(' – ') || null,
    description: role.description || `${role.title} at ${role.company}`,
    skills: Array.isArray(role.skills) ? role.skills : [],
    metrics: [] as string[],
    source: 'resume' as const,
  }));

  const educationData = (parsed.education || []).map((edu) => ({
    userId,
    degree: edu.degree || 'Degree',
    institution: edu.institution || null,
    year: edu.year ? String(edu.year) : null,
    cgpa: edu.cgpa ? String(edu.cgpa) : null,
    source: 'resume' as const,
  }));

  const leadershipData = (parsed.leadership || []).map((item) => ({
    userId,
    title: item.title || 'Role',
    organization: item.organization || null,
    period: item.period || null,
    location: item.location || null,
    bullets: Array.isArray(item.bullets) ? item.bullets : [],
    source: 'resume' as const,
  }));

  const certificationData = (parsed.certifications || []).map((cert) => ({
    userId,
    name: cert.name || 'Certification',
    issuer: cert.issuer || null,
    issuedYear: cert.issuedYear ? String(cert.issuedYear) : null,
    credentialUrl: cert.credentialUrl || null,
    source: 'resume' as const,
  }));

  const projectData = (parsed.projects || []).map((proj) => ({
    userId,
    title: proj.title || 'Project',
    description: proj.description || '',
    skills: Array.isArray(proj.skills) ? proj.skills : [],
    link: proj.link || null,
    source: 'resume' as const,
  }));

  const languageData = (parsed.languages || []).map((lang) => ({
    userId,
    language: lang.language || lang.name || 'Language',
    proficiency: lang.proficiency || null,
    source: 'resume' as const,
  }));

  const skillNames = [
    ...(parsed.skills || []),
    ...(parsed.roles || []).flatMap((r) => r.skills || []),
    ...(parsed.projects || []).flatMap((p) => p.skills || []),
  ];
  const skillData = [...new Set(skillNames.filter(Boolean))].map((name) => ({
    userId, name, source: 'resume' as const,
  }));

  if (experienceData.length > 0) await prisma.experience.createMany({ data: experienceData });
  if (educationData.length > 0) await prisma.education.createMany({ data: educationData });
  if (leadershipData.length > 0) await prisma.leadership.createMany({ data: leadershipData });
  if (certificationData.length > 0) await prisma.certification.createMany({ data: certificationData });
  if (projectData.length > 0) await prisma.project.createMany({ data: projectData });
  if (languageData.length > 0) await prisma.language.createMany({ data: languageData });
  if (skillData.length > 0) await prisma.skill.createMany({ data: skillData, skipDuplicates: true });

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.name || user.name,
      email: parsed.email || user.email,
      phone: parsed.phone || user.phone,
      location: parsed.location || user.location,
      linkedinUrl: parsed.linkedinUrl || user.linkedinUrl,
      ...(parsed.interests ? { interests: parsed.interests } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    counts: {
      experiences: experienceData.length,
      education: educationData.length,
      leadership: leadershipData.length,
      certifications: certificationData.length,
      projects: projectData.length,
      skills: skillData.length,
    },
  });
}
