import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="m-4">
      <h1>HomePage Content</h1>
    </div>
  );
}
