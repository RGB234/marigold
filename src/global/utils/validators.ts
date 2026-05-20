import { validateTsid } from "@/global/validation/validators";

export const validBASE32 = (id: string | null | undefined): boolean => {
  return validateTsid(id);
};
