import api from "@/api/api";

type UUID = string;

const apiAdoption = import.meta.env.VITE_API_ADOPTION;

export const getAdoptionDetail = async (id: UUID) => {
  const response = await api.get(`${apiAdoption}/${id}`);
  return response.data;
};
