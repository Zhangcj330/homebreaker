import { NextRequest, NextResponse } from "next/server";

const LEVEL_PASSWORDS = ["0221", "3147", "8095"] as const;

function getLevelIndex(level: unknown) {
  const levelNumber = typeof level === "number" ? level : Number(level);

  if (!Number.isInteger(levelNumber)) return -1;
  return levelNumber - 1;
}

export async function POST(req: NextRequest) {
  try {
    const { level, password } = await req.json();
    const levelIndex = getLevelIndex(level);

    if (
      levelIndex < 0 ||
      levelIndex >= LEVEL_PASSWORDS.length ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ unlocked: false }, { status: 400 });
    }

    const unlocked = password === LEVEL_PASSWORDS[levelIndex];
    const completed = unlocked && levelIndex === LEVEL_PASSWORDS.length - 1;

    return NextResponse.json({
      unlocked,
      completed,
      nextLevel: unlocked && !completed ? levelIndex + 2 : undefined,
    });
  } catch {
    return NextResponse.json({ unlocked: false }, { status: 400 });
  }
}
