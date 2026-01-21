import { Neutering } from "@/enums/Neutering";
import { Sex } from "@/enums/Sex";
import { Species } from "@/enums/Species";

export interface AdoptionCreateRequest {
  species: Species;
  title: string;
  age: number;
  sex: Sex;
  area: string;
  weight: number;
  neutering: Neutering;
  features: string;
  images: File[];
}