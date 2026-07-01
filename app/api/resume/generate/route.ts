import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import PDFDocument from 'pdfkit';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';
const QUICK_JD = 'Write a strong general-purpose professional resume that showcases all my most impactful work, key skills, and achievements.';

const MARGIN = 50;
function pw(doc: InstanceType<typeof PDFDocument>) { return doc.page.width - MARGIN * 2; }
function str(v: unknown) { return String(v ?? ''); }

function fmtDate(d: string): string {
  const m = d.match(/^(\d{4})-(\d{2})$/);
  if (!m) return d;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}
function fmtPeriod(p: string | null): string {
  if (!p) return '';
  return p.replace(/(\d{4}-\d{2})/g, (s) => fmtDate(s));
}

function parseJson(text: string) {
  return JSON.parse(text.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatePdf(resumeData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#111111').text(resumeData.name || 'Resume');
    const contact = [resumeData.email, resumeData.phone, resumeData.location, resumeData.linkedinUrl].filter(Boolean).join('  ·  ');
    if (contact) doc.font('Helvetica').fontSize(9.5).fillColor('#666666').text(contact);
    doc.moveDown(0.3);
    doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + pw(doc), doc.y).strokeColor('#aaaaaa').lineWidth(1).stroke();

    function section(label: string) {
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#555555').text(label, { characterSpacing: 1.5 });
      const y = doc.y + 2;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + pw(doc), y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.35);
    }

    const isFresher = resumeData.experienceLevel === 'fresher';
    const order = isFresher
      ? ['summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'leadership', 'languages', 'interests']
      : ['summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'leadership', 'languages', 'interests'];

    for (const key of order) {
      if (key === 'summary' && resumeData.summary) {
        section('SUMMARY');
        doc.font('Helvetica').fontSize(10.5).fillColor('#444444').text(resumeData.summary, { lineGap: 2 });
      }
      if (key === 'experience' && resumeData.experience?.length) {
        section('EXPERIENCE');
        for (const exp of resumeData.experience) {
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text(str(exp.title));
          const meta = [exp.company, exp.location, fmtPeriod(exp.period)].filter(Boolean).join('  ·  ');
          if (meta) doc.font('Helvetica').fontSize(10).fillColor('#666666').text(meta);
          for (const b of (exp.bullets || [])) {
            doc.font('Helvetica').fontSize(10).fillColor('#333333').text(`• ${str(b)}`, { indent: 8, lineGap: 1 });
          }
          doc.moveDown(0.5);
        }
      }
      if (key === 'skills' && resumeData.skills?.length) {
        section('SKILLS');
        doc.font('Helvetica').fontSize(10).fillColor('#333333').text(resumeData.skills.join('  ·  '), { lineGap: 3 });
      }
      if (key === 'projects' && resumeData.projects?.length) {
        section('PROJECTS');
        for (const p of resumeData.projects) {
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111111').text(str(p.title));
          if (p.description) doc.font('Helvetica').fontSize(10).fillColor('#333333').text(str(p.description), { lineGap: 1 });
          doc.moveDown(0.4);
        }
      }
      if (key === 'education' && resumeData.education?.length) {
        section('EDUCATION');
        for (const e of resumeData.education) {
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111111').text(str(e.degree));
          const meta = [e.institution, e.year].filter(Boolean).join(', ');
          if (meta) doc.font('Helvetica').fontSize(10).fillColor('#666666').text(meta);
          if (e.cgpa) doc.font('Helvetica').fontSize(10).fillColor('#666666').text(`CGPA: ${e.cgpa}`);
          doc.moveDown(0.3);
        }
      }
      if (key === 'certifications' && resumeData.certifications?.length) {
        section('CERTIFICATIONS');
        for (const c of resumeData.certifications) {
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111111').text(str(c.name));
          const meta = [c.issuer, c.issuedYear].filter(Boolean).join(' — ');
          if (meta) doc.font('Helvetica').fontSize(10).fillColor('#666666').text(meta);
          doc.moveDown(0.3);
        }
      }
      if (key === 'leadership' && resumeData.leadership?.length) {
        section('LEADERSHIP');
        for (const l of resumeData.leadership) {
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text(str(l.title));
          const meta = [l.organization, l.period ? fmtPeriod(l.period) : null].filter(Boolean).join('  ·  ');
          if (meta) doc.font('Helvetica').fontSize(10).fillColor('#666666').text(meta);
          for (const b of (l.bullets || [])) {
            doc.font('Helvetica').fontSize(10).fillColor('#333333').text(`• ${str(b)}`, { indent: 8, lineGap: 1 });
          }
          doc.moveDown(0.5);
        }
      }
      if (key === 'languages' && resumeData.languages?.length) {
        section('LANGUAGES');
        doc.font('Helvetica').fontSize(10).fillColor('#333333')
          .text(resumeData.languages.map((l: { language: string; proficiency?: string }) => [l.language, l.proficiency].filter(Boolean).join(' — ')).join('  ·  '));
      }
      if (key === 'interests' && resumeData.interests) {
        section('INTERESTS');
        doc.font('Helvetica').fontSize(10).fillColor('#333333').text(str(resumeData.interests));
      }
    }

    doc.end();
  });
}

export async function POST(req: NextRequest) {
  try {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const jobDescription = body.jobDescription || QUICK_JD;
  const userId = session.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [experiences, educations, certifications, languages, skillRows, projectRows, leadershipRows] = await Promise.all([
    prisma.experience.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 15 }),
    prisma.education.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.certification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.language.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.skill.findMany({ where: { userId } }),
    prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.leadership.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  if (experiences.length === 0) {
    return NextResponse.json({ error: 'No experiences logged yet. Import your resume first.' }, { status: 400 });
  }

  const isFresher = user.experienceLevel === 'fresher';
  const systemPrompt = isFresher
    ? 'You are a professional resume writer helping a recent graduate. Emphasize academic achievements, transferable skills, and potential. Return ONLY a JSON object: { "summary": string, "experience": [{ "title": string, "company": string, "period": string, "bullets": string[] }], "projects": [{ "title": string, "description": string, "link": string }], "skills": string[] }. No preamble, no markdown.'
    : 'You are a professional resume writer. Write a results-driven, achievement-focused resume. Use quantified impact. Return ONLY a JSON object: { "summary": string, "experience": [{ "title": string, "company": string, "period": string, "bullets": string[] }], "projects": [{ "title": string, "description": string, "link": string }], "skills": string[] }. No preamble, no markdown.';

  const top8 = experiences.slice(0, 8);
  const topProjects = projectRows.slice(0, 5);
  const skills = skillRows.map((s) => s.name);

  const prompt = [
    `Job Description:\n${jobDescription}`,
    `Experiences:\n${JSON.stringify(top8, null, 2)}`,
    topProjects.length > 0 ? `Projects:\n${JSON.stringify(topProjects, null, 2)}` : null,
    skills.length > 0 ? `Verified skill list:\n${skills.join(', ')}` : null,
  ].filter(Boolean).join('\n\n');

  const message = await anthropic.messages.create({
    model: MODEL, max_tokens: 4096, system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  const resumeData = parseJson('text' in block ? block.text : '');

  // Attach factual data
  resumeData.name = user.name;
  resumeData.email = user.email;
  resumeData.phone = user.phone;
  resumeData.location = user.location;
  resumeData.linkedinUrl = user.linkedinUrl;
  resumeData.education = educations.map((e) => ({ degree: e.degree, institution: e.institution, year: e.year, cgpa: e.cgpa }));
  resumeData.certifications = certifications.map((c) => ({ name: c.name, issuer: c.issuer, issuedYear: c.issuedYear }));
  resumeData.languages = languages.map((l) => ({ language: l.language, proficiency: l.proficiency }));
  resumeData.leadership = leadershipRows.map((l) => ({ title: l.title, organization: l.organization, period: l.period, location: l.location, bullets: l.bullets }));
  resumeData.interests = user.interests;
  resumeData.experienceLevel = user.experienceLevel;

  const pdfBuffer = await generatePdf(resumeData);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
    },
  });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[resume/generate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
