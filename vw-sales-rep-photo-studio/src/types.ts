export type Dealer = "마이스터모터스" | "아우토플라츠" | "클라쎄오토" | "지오하우스" | "지엔비";

export type Showroom = string;

export type BackgroundType = "solid" | "logo" | "showroom";

export interface HistoryItem {
  id: number;
  name: string;
  dealer: string;
  showroom: string;
  image_front: string;
  image_side: string;
  image_full: string;
  background_type: BackgroundType;
  created_at: string;
}

export const DEALER_SHOWROOMS: Record<Dealer, string[]> = {
  "마이스터모터스": ["강남대치", "구로천왕", "인천"],
  "클라쎄오토": ["일산", "수원", "용산", "동대문", "구리", "해운대", "동래"],
  "아우토플라츠": ["송파", "판교", "분당", "안양", "원주", "대전", "천안"],
  "지오하우스": ["전주", "광주", "순천"],
  "지엔비": ["대구", "창원"]
};
