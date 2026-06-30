export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: session!.userId } });

  const [expCount, eduCount, certCount, projCount, skillCount, leaderCount] = await Promise.all([
    prisma.experience.count({ where: { userId: session!.userId } }),
    prisma.education.count({ where: { userId: session!.userId } }),
    prisma.certification.count({ where: { userId: session!.userId } }),
    prisma.project.count({ where: { userId: session!.userId } }),
    prisma.skill.count({ where: { userId: session!.userId } }),
    prisma.leadership.count({ where: { userId: session!.userId } }),
  ]);

  const stats = [
    { label: 'Work experiences', value: expCount },
    { label: 'Education entries', value: eduCount },
    { label: 'Certifications', value: certCount },
    { label: 'Projects', value: projCount },
    { label: 'Skills tracked', value: skillCount },
    { label: 'Leadership roles', value: leaderCount },
  ];

  const isSetup = expCount > 0;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">
        Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </h1>
      <p className="text-gray-500 mb-8">
        {user?.jobTitle && user.jobTitle !== 'hi' ? user.jobTitle : 'Your career tracking dashboard'}
      </p>

      {!isSetup && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">Get started in 2 steps</h2>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>
              <Link href="/dashboard/profile" className="underline">Complete your profile</Link>
              {' '}— name, job title, experience level
            </li>
            <li>
              <Link href="/dashboard/experiences" className="underline">Import your resume</Link>
              {' '}— upload a PDF and we&apos;ll extract everything
            </li>
          </ol>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-blue-600 mb-1">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/resume" className="bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition-colors">
          <div className="text-2xl mb-2">📄</div>
          <div className="font-semibold">Generate resume</div>
          <div className="text-blue-200 text-sm mt-1">Tailored to any job description</div>
        </Link>
        <Link href="/dashboard/experiences" className="bg-white border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-gray-900">View my data</div>
          <div className="text-gray-400 text-sm mt-1">Experiences, skills, education</div>
        </Link>
      </div>

      <p className="mt-8 text-sm text-gray-400">
        📱 Use WhatsApp to log voice updates on the go → <span className="font-medium text-gray-600">+1 415 523 8886</span>
      </p>
    </div>
  );
}
