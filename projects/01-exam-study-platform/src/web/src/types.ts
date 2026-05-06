// 題庫資料型別定義

export interface Question {
  no: number
  question: string
  options: Record<'A' | 'B' | 'C' | 'D', string>
  answer: string
  explanation: string
}

export interface Session {
  session: string
  questions: Question[]
}

export interface Subject {
  key: string
  title: string
  total: number
  sessions: Session[]
}

export type ExamGroupKey = 'fintech-exam' | 'ai-planner-mid' | 'ecommerce-course' | 'securities-broker'
export type SubjectKey =
  | 'fintech'
  | 'ai-planning'
  | 'big-data'
  | 'machine-learning'
  | 'ecommerce-finance-midterm-113'
  | 'securities-broker-law-110'
  | 'securities-broker-law-111'
  | 'securities-broker-law-112'
  | 'securities-broker-law-113'
  | 'securities-broker-law-114'
  | 'securities-broker-law-115'
  | 'securities-broker-finance-110'
  | 'securities-broker-finance-111'
  | 'securities-broker-finance-112'
  | 'securities-broker-finance-113'
  | 'securities-broker-finance-114'
  | 'securities-broker-finance-115'

export interface SubjectMeta {
  key: SubjectKey
  label: string
  groupKey: ExamGroupKey
}

export interface ExamGroup {
  key: ExamGroupKey
  title: string
  subjectKeys: SubjectKey[]
}

export const SUBJECTS: SubjectMeta[] = [
  { key: 'fintech', label: '金融科技力', groupKey: 'fintech-exam' },
  { key: 'ai-planning', label: 'AI規劃師 第一科', groupKey: 'ai-planner-mid' },
  { key: 'big-data', label: 'AI規劃師 第二科', groupKey: 'ai-planner-mid' },
  { key: 'machine-learning', label: 'AI規劃師 第三科', groupKey: 'ai-planner-mid' },
  { key: 'ecommerce-finance-midterm-113', label: '113電子商務財務管理(期中考)', groupKey: 'ecommerce-course' },
  { key: 'securities-broker-law-110', label: '法規與實務（110年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-law-111', label: '法規與實務（111年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-law-112', label: '法規與實務（112年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-law-113', label: '法規與實務（113年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-law-114', label: '法規與實務（114年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-law-115', label: '法規與實務（115年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-finance-110', label: '投資與財務分析（110年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-finance-111', label: '投資與財務分析（111年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-finance-112', label: '投資與財務分析（112年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-finance-113', label: '投資與財務分析（113年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-finance-114', label: '投資與財務分析（114年）', groupKey: 'securities-broker' },
  { key: 'securities-broker-finance-115', label: '投資與財務分析（115年）', groupKey: 'securities-broker' },
]

export const EXAM_GROUPS: ExamGroup[] = [
  {
    key: 'securities-broker',
    title: '證券商業務員（初業）',
    subjectKeys: [
      'securities-broker-law-115',
      'securities-broker-law-114',
      'securities-broker-law-113',
      'securities-broker-law-112',
      'securities-broker-law-111',
      'securities-broker-law-110',
      'securities-broker-finance-115',
      'securities-broker-finance-114',
      'securities-broker-finance-113',
      'securities-broker-finance-112',
      'securities-broker-finance-111',
      'securities-broker-finance-110',
    ],
  },
  {
    key: 'fintech-exam',
    title: '金融科技力',
    subjectKeys: ['fintech'],
  },
  {
    key: 'ai-planner-mid',
    title: 'AI應用規劃師（中級）',
    subjectKeys: ['ai-planning', 'big-data', 'machine-learning'],
  },
  {
    key: 'ecommerce-course',
    title: '電子商務課程 / 校內考試',
    subjectKeys: ['ecommerce-finance-midterm-113'],
  },
]

export const ALL_SUBJECT_KEYS = SUBJECTS.map(subject => subject.key) as SubjectKey[]
export const PUBLIC_SUBJECT_KEYS: SubjectKey[] = ['ecommerce-finance-midterm-113']

export function isSubjectKey(value: string): value is SubjectKey {
  return ALL_SUBJECT_KEYS.includes(value as SubjectKey)
}
