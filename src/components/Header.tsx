interface HeaderProps {
  totalXp: number;
}

export function Header({ totalXp }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-semibold">Git Tutorial &amp; Quiz</h1>
      <p className="text-sm text-muted-foreground">⭐ {totalXp} XP</p>
    </header>
  );
}
