export interface Citation {
  ref: number;
  text: string;
  url: string;
}

export interface Profile {
  id: string;
  name: string;
  short_description: string;
  summary: string;
  detailed_record: string;
  created_at: string;
  tags: string[];
  citations: Citation[][];
  iframe_url?: string;
  image_url?: string;
  short_description_html?: string;
  summary_html?: string;
  detailed_record_html?: string;
  search_vector?: any;
  short_description_lawyered?: boolean;
  summary_lawyered?: boolean;
  detailed_record_lawyered?: boolean;
}

export interface TagType {
  name: string;
  count: number;
}