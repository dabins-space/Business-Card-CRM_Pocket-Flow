/**
 * Shared constants and mock data for the Business Card CRM application
 */

/**
 * Inquiry type options for business cards and interactions
 */
export const INQUIRY_TYPE_OPTIONS = [
  { value: "proposal", label: "제안" },
  { value: "consult", label: "상담" },
  { value: "inquiry", label: "문의" },
  { value: "partnership", label: "파트너십" },
  { value: "support", label: "지원" },
  { value: "meeting", label: "미팅" },
  { value: "followup", label: "후속 조치" },
];

/**
 * Vertical (industry) options
 */
export const VERTICAL_OPTIONS = [
  { value: "shipbuilding", label: "조선/해양" },
  { value: "battery", label: "2차전지" },
  { value: "semiconductor", label: "반도체" },
  { value: "display", label: "디스플레이" },
  { value: "steel", label: "철강" },
  { value: "chemical", label: "화학" },
  { value: "energy", label: "에너지" },
  { value: "automotive", label: "자동차" },
  { value: "aerospace", label: "항공우주" },
  { value: "construction", label: "건설/플랜트" },
  { value: "manufacturing", label: "제조" },
  { value: "logistics", label: "물류" },
  { value: "it", label: "IT/소프트웨어" },
  { value: "finance", label: "금융" },
  { value: "healthcare", label: "헬스케어" },
  { value: "other", label: "기타" },
];

/**
 * Get vertical label by value
 */
export const getVerticalLabel = (value: string): string => {
  const vertical = VERTICAL_OPTIONS.find(v => v.value === value);
  return vertical ? vertical.label : value;
};

/**
 * Mock business card data for development and testing
 */
export const MOCK_CARDS = [
  {
    id: 1,
    name: "김철수",
    position: "팀장",
    department: "개발팀",
    company: "테크코퍼레이션",
    vertical: "it",
    email: "kim@techcorp.com",
    phone: "010-1234-5678",
    importance: 5,
    inquiryTypes: ["제안", "파트너십"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
    date: "2025-10-17",
  },
  {
    id: 2,
    name: "이영희",
    position: "디자인 디렉터",
    department: "디자인팀",
    company: "디자인스튜디오",
    vertical: "it",
    email: "lee@designstudio.com",
    phone: "010-2345-6789",
    importance: 4,
    inquiryTypes: ["상담"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
    date: "2025-10-16",
  },
  {
    id: 3,
    name: "박민수",
    position: "영업이사",
    department: "영업부",
    company: "솔루션즈",
    vertical: "manufacturing",
    email: "park@solutions.com",
    phone: "010-3456-7890",
    importance: 3,
    inquiryTypes: ["문의"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
    date: "2025-10-15",
  },
  {
    id: 4,
    name: "최지원",
    position: "구매담당",
    department: "구매부",
    company: "현대조선",
    vertical: "shipbuilding",
    email: "choi@hdshipbuilding.com",
    phone: "010-4567-8901",
    importance: 5,
    inquiryTypes: ["제안", "미팅"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
    date: "2025-10-14",
  },
  {
    id: 5,
    name: "정수진",
    position: "연구원",
    department: "R&D센터",
    company: "LG에너지솔루션",
    vertical: "battery",
    email: "jung@lges.com",
    phone: "010-5678-9012",
    importance: 4,
    inquiryTypes: ["파트너십"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
    date: "2025-10-13",
  },
];

/**
 * Simplified card data for dropdowns and selections
 */
export const MOCK_CARDS_SIMPLE = [
  { value: "1", label: "김철수 - 테크코퍼레이션", company: "테크코퍼레이션", position: "개발팀장" },
  { value: "2", label: "이영희 - 디자인스튜디오", company: "디자인스튜디오", position: "디자인 디렉터" },
  { value: "3", label: "박민수 - 솔루션즈", company: "솔루션즈", position: "영업이사" },
];
