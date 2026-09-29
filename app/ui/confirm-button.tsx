"use client";

import { useFormStatus } from "react-dom";

/** 누르면 확인 창을 띄우고, 확인했을 때만 감싼 form을 제출한다. */
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
