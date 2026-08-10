export interface ProjectCategoryOption {
  title: string;
  subtitle: string;
}

export const PROJECT_CATEGORIES: ProjectCategoryOption[] = [
  {
    title: "브랜딩 에이전시",
    subtitle: "브랜드 전략, 비주얼 아이덴티티, 브랜드 경험 설계",
  },
  {
    title: "마케팅 에이전시",
    subtitle: "디지털 마케팅, 콘텐츠 마케팅, 오프라인 마케팅",
  },
  {
    title: "크리에이티브 에이전시",
    subtitle: "광고 크리에이티브, 디자인 제작, 영상 / 사진",
  },
  {
    title: "엔터테인먼트 에이전시",
    subtitle: "음악 제작, 영상 콘텐츠, 아티스트 매니지먼트",
  },
  {
    title: "이벤트 / 프로덕션",
    subtitle: "행사 기획 및 운영, 무대 / 공간 제작, 굿즈 / MD",
  },
  {
    title: "디지털 / 테크 에이전시",
    subtitle: "웹 / 앱 개발, UX / UI 디자인, 크리에이티브 테크",
  },
  {
    title: "전략 컨설팅",
    subtitle: "사업 전략, 브랜드 컨설팅, 콘텐츠 전략",
  },
];

export interface ProjectInquiry {
  category: string;
  purpose: string;
  painPoint: string;
  targetAudience: string;
  successCriteria: string;
  launchDate: string;
  budget: string;
}

export const EMPTY_PROJECT: ProjectInquiry = {
  category: "",
  purpose: "",
  painPoint: "",
  targetAudience: "",
  successCriteria: "",
  launchDate: "",
  budget: "",
};

export const MAX_PROJECTS = 3;
