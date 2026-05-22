import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-card text-primary hover:border-primary",
        secondary: "bg-card text-primary border border-border hover:border-primary",
        ghost: "bg-transparent text-primary hover:bg-muted hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        gold: "bg-gradient-to-r from-secondary to-[hsl(43,80%,60%)] text-secondary-foreground font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:brightness-110",
        goldOutline: "border-2 border-secondary text-secondary bg-transparent hover:bg-secondary hover:text-secondary-foreground font-bold",
        hero: "group relative overflow-hidden bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95",
        heroOutline: "border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground hover:border-primary-foreground/50 font-semibold",
        outlineOnDark: "border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground hover:border-primary-foreground/50 font-semibold",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-full px-4",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ShineLayer = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 flex justify-center pointer-events-none [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]"
  >
    <div className="relative h-full w-8 bg-white/20" />
  </div>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const showShine = variant === "default" || variant === undefined || variant === "hero";

    let content: React.ReactNode = children;
    if (showShine) {
      if (asChild && React.isValidElement(children)) {
        const child = children as React.ReactElement<{ children?: React.ReactNode }>;
        content = React.cloneElement(child, {
          children: (
            <>
              <span className="relative z-10 inline-flex items-center gap-2">{child.props.children}</span>
              <ShineLayer />
            </>
          ),
        });
      } else {
        content = (
          <>
            <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
            <ShineLayer />
          </>
        );
      }
    }

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
