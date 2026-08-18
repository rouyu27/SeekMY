// MAIN / TEAM SHARED UI FOUNDATION | Maintenance assignment: WILSON CHOONG WEI SHAN
// GitHub target: main (shared base; maintenance assignment is not sole authorship)
// TEAM SHARED / generated UI dependency — Primary uploader: LowJunFeng
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };

// TEAM SHARED / generated UI dependency END
