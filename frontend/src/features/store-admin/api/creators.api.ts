import { apiClient } from "@/lib/api/client";
export type StoreCreator={id:string;displayName:string;email:string|null;status:string;instagramUsername:string|null;instagramStatus:string|null;assignedAt:string};
export async function getStoreCreators(){return (await apiClient.get<{creators:StoreCreator[]}>("/store/creators")).data.creators;}
