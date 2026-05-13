import { useMutation, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";

import {
  cashierLogin,
  cashierLogout,
  cashierMe,
} from "@/features/cashier-auth/api";
import {
  cashierSessionAtom,
  cashierTokenAtom,
} from "@/features/cashier-auth/state";

export function useCashierMe() {
  const [token] = useAtom(cashierTokenAtom);
  const [, setSession] = useAtom(cashierSessionAtom);
  const [, setToken] = useAtom(cashierTokenAtom);
  return useQuery({
    queryKey: ["cashier-auth", "me"],
    queryFn: async () => {
      try {
        const res = await cashierMe();
        setSession(res);
        return res;
      } catch (err) {
        setToken(null);
        setSession(null);
        throw err;
      }
    },
    enabled: !!token,
    retry: false,
  });
}

export function useCashierLogin() {
  const [, setToken] = useAtom(cashierTokenAtom);
  const [, setSession] = useAtom(cashierSessionAtom);
  return useMutation({
    mutationFn: cashierLogin,
    onSuccess: (res) => {
      setToken(res.token);
      setSession(res);
    },
  });
}

export function useCashierLogout() {
  const [, setToken] = useAtom(cashierTokenAtom);
  const [, setSession] = useAtom(cashierSessionAtom);
  return useMutation({
    mutationFn: cashierLogout,
    onSuccess: () => {
      setToken(null);
      setSession(null);
    },
    onError: () => {
      setToken(null);
      setSession(null);
    },
  });
}
