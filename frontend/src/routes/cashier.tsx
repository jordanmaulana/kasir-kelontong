import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cashier")({
  component: CashierLayout,
});

function CashierLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
