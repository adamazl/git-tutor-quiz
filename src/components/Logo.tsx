interface LogoProps {
  className?: string;
}

/** The GitGud mark — same artwork as public/favicon.svg, reused inline so it can sit at any size in the UI. */
export function Logo({ className }: LogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}favicon.svg`}
      alt=""
      aria-hidden="true"
      className={className}
      width={28}
      height={27}
    />
  );
}
