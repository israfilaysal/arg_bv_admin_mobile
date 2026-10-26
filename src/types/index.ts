// =============================================================================
// arg.bv Platform Enums (arg.bv.entity/Custom/Enums.cs ile birebir eşitlenmiştir)
// =============================================================================

export enum ResultType {
  success = 1,
  error = 2,
  warning = 3,
  info = 4,
}

export enum SmsType {
  Register = 0,
  Login = 1,
  ChangePhone = 2,
}

export enum EmailType {
  ChangeEmail = 0,
}

export enum CompanyStatus {
  Passive = 0,
  Active = 1,
  Pending = 2,
  Banned = 3,
  PendingPayment = 4,
}

export enum CompanyUserStatus {
  Pending = 0,
  Active = 1,
  Passive = 2,
  Rejected = 3,
}

export enum DemandStatus {
  Pending = 0,   // Onay Bekliyor
  Active = 1,    // Aktif
  Closed = 2,    // Kapatıldı
  Expired = 3,   // Süresi Doldu
  Rejected = 4,  // Reddedildi
  Deleted = 5,   // Silindi (Soft Delete)
}

export enum DemandTargetMode {
  SmartRadius = 1,   // Akıllı Arama
  FixedRadius = 2,   // Sabit Çap
  CityDistrict = 3,  // İl / İlçe
  Favorites = 4,     // Favorilerim
}

export enum DemandCompanyStatus {
  Active = 1,     // Aktif (Havuzda Gösteriliyor)
  Archived = 2,   // Arşivlendi
  Reported = 3,   // Şikayet Edildi / Yasaklandı / Gizlendi
}

export enum DemandCompanyResponseStatus {
  Pending = 0,    // Yanıt Bekliyor
  Accepted = 1,   // Bende Var (Stokta Var / Fiyat Verildi)
  Rejected = 2,   // Bende Yok (Stokta Bulunmuyor)
}

export enum DemandSearchStep {
  RadiusKm = 1,             // 1 km Çap Alanı
  District = 2,             // İlçe Taraması
  City = 3,                 // İl Taraması
  AllCategory = 4,          // Kategoriye Ait Tüm Firmalar
  Stopped = 8,              // Durduruldu
  Completed = 9,            // Tüm Aramalar Tamamlandı
}

export enum UserStatus {
  Passive = 0,
  Active = 1,
  Banned = 2,      // Kalıcı Yasaklı
  Suspended = 3,   // Geçici Yasaklı
}

export enum ReportStatus {
  Pending = 0,    // Bekliyor
  Resolved = 1,   // Çözüldü / Aksiyon Alındı
  Dismissed = 2,  // Reddedildi / Kapatıldı
}

export enum ReportTargetType {
  Demand = 1,         // Talep
  DemandAnswer = 2,   // Sohbet / Mesaj
  User = 3,           // Kullanıcı Profil
  Company = 4,        // Firma Profil
}

export enum ReportReason {
  SpamOrUnnecessary = 1,  // Gereksiz / Sahte Talep veya Teklif
  AbusiveOrOffensive = 2, // Rahatsız Edici / Küfürlü Mesaj
  FraudOrHarassment = 3,  // Dolandırıcılık / Taciz
  FakeOffer = 4,          // Yanıltıcı / Sahte Fiyat veya Teklif
  Other = 99,             // Diğer
}

export enum ReportActionType {
  None = 0,             // Aksiyon Yok
  ContentDeleted = 1,   // İçerik Silindi
  Warned = 2,           // Uyarı Verildi
  UserBanned = 3,       // Kullanıcı Banlandı
  CompanyBanned = 4,    // Firma Banlandı
}

export enum AnnouncementPopupType {
  Announcement = 1,  // Duyuru / Bildirim
  Celebration = 2,   // Tebrik / Kutlama
  Campaign = 3,      // Kampanya / Fırsat
  SystemInfo = 4,    // Sistem Bilgilendirmesi
}

export enum FeatureValueType {
  Boolean = 1,
  Integer = 2,
  Decimal = 3,
  Text = 4,
  Unlimited = 5,
}

export enum BillingPeriod {
  Monthly = 1,
  Yearly = 2,
  Custom = 3,
}

export enum SubscriptionStatus {
  PendingPayment = 1,
  Active = 2,
  Expired = 3,
  Cancelled = 4,
  Replaced = 5,
  PaymentFailed = 6,
  Scheduled = 7,
}

export enum PaymentStatus {
  Pending = 1,
  Success = 2,
  Failed = 3,
  Cancelled = 4,
  Refunded = 5,
  PartiallyRefunded = 6,
}

export enum PaymentType {
  NewSubscription = 1,
  Upgrade = 2,
  Renewal = 3,
  Downgrade = 4,
}

// =============================================================================
// Data Interfaces & DTOs
// =============================================================================

export interface ArgResult<T = any> {
  resulttype: number | string;
  ResultType?: number | string;
  message?: string;
  description?: string;
  Description?: string;
  value?: T;
  Value?: T;
  data?: T;
  Data?: T;
  [key: string]: any;
}

export interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  pendingCompanies: number;
  totalDemands: number;
  activeDemands: number;
  openReports: number;
  todayDemands: number;
  totalSuccessRevenue?: number;
  totalPendingRevenue?: number;
}

export interface CompanyItem {
  id: number | string;
  name: string;
  creator?: string;
  userid?: number | string;
  username?: string;
  userdisplayname?: string;
  userfullname?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  taxoffice?: string;
  taxnumber?: string;
  address?: string;
  description?: string;
  categoryids?: string;
  categorynames?: string;
  status: CompanyStatus | number | string; // CompanyStatus: 0: Passive, 1: Active, 2: Pending, 3: Banned, 4: PendingPayment
  createtime?: string;
  rating?: number;
  reviewcount?: number;
  banreason?: string;
  shape?: any;
}

export interface CompanyUserItem {
  id: number | string;
  companyid: number | string;
  userid: number | string;
  username?: string;
  role: string | number;
  status: CompanyUserStatus | number | string; // CompanyUserStatus: 0: Pending, 1: Active, 2: Passive, 3: Rejected
  createtime?: string;
}

export interface DemandItem {
  id: number | string;
  description: string;
  userfullname?: string;
  userdisplayname?: string;
  username?: string;
  userphone?: string;
  userid?: number | string;
  categoryname?: string;
  categoryids?: string;
  categoryid?: number | string;
  status: DemandStatus | number | string; // DemandStatus: 0: Pending, 1: Active, 2: Closed, 3: Expired, 4: Rejected, 5: Deleted
  searchstatustext?: string; // Arama durumu
  rejectdescription?: string; // Reddedilme gerekçesi
  createtime?: string | number;
  respondedcount?: number;
  bendevarcount?: number;
  bendeyokcount?: number;
  city?: string;
  district?: string;
  cityid?: number | string;
  districtid?: number | string;
  targetmode?: DemandTargetMode | number | string; // DemandTargetMode: 1: SmartRadius, 2: FixedRadius, 3: CityDistrict, 4: Favorites
  searchstep?: DemandSearchStep | number | string; // DemandSearchStep: 1: RadiusKm, 2: District, 3: City, 4: AllCategory, 8: Stopped, 9: Completed
  images?: string;
  isurgent?: number | string;
  radiuskm?: number;
}

export interface ReportItem {
  id: number | string;
  title?: string;
  content: string;
  reporterfullname?: string;
  reporterid?: number | string;
  targettype?: ReportTargetType | number | string; // ReportTargetType: 1: Demand, 2: DemandAnswer, 3: User, 4: Company
  targetid?: number | string;
  status: ReportStatus | number | string; // ReportStatus: 0: Pending, 1: Resolved, 2: Dismissed
  createtime?: string;
  adminnote?: string;
  actiontype?: ReportActionType | number | string; // ReportActionType: 0: None, 1: ContentDeleted, 2: Warned, 3: UserBanned, 4: CompanyBanned
}

export interface UserItem {
  id: number | string;
  username: string;
  displayname?: string;
  phone?: string;
  email?: string;
  status: UserStatus | number | string; // UserStatus: 0: Passive, 1: Active, 2: Banned, 3: Suspended
  role?: string;
  createtime?: string;
  banreason?: string;
}

export interface PaymentItem {
  id: number | string;
  companyid?: number | string;
  companyname?: string;
  priceplanid?: number | string;
  planname?: string;
  amount?: number;
  price?: number;
  paidprice?: number;
  paidamount?: number;
  currency?: string;
  status: PaymentStatus | number | string; // PaymentStatus: 1: Pending, 2: Success, 3: Failed, 4: Cancelled, 5: Refunded, 6: PartiallyRefunded
  paymentprovider?: string;
  providerpaymentid?: string;
  conversationid?: string;
  errormessage?: string;
  errorcode?: string;
  rawrequest?: string;
  rawresponse?: string;
  token?: string;
  createtime?: any;
}

export interface SubscriptionItem {
  id: number | string;
  companyid?: number | string;
  companyname?: string;
  priceplanid?: number | string;
  planname?: string;
  paidamount?: number;
  currency?: string;
  status: SubscriptionStatus | number | string; // SubscriptionStatus: 1: PendingPayment, 2: Active, 3: Expired, 4: Cancelled, 5: Replaced, 6: PaymentFailed, 7: Scheduled
  startdate?: string;
  enddate?: string;
  periodtype?: BillingPeriod | number | string;
  autorenew?: number | boolean;
  createtime?: any;
}

export interface CategoryItem {
  id: number | string;
  categoryname?: string;
  name?: string; // fallback
  description?: string;
  parentid?: number | string | null;
  parentname?: string;
  orderby?: number;
  displayorder?: number;
  icon?: string;
  isactive?: number | string;
  status?: number | string;
  createtime?: any;
  companycount?: number;
}

export interface AnnouncementItem {
  id: number | string;
  title: string;
  content: string;
  popuptype?: AnnouncementPopupType | number | string; // AnnouncementPopupType: 1: Announcement, 2: Celebration, 3: Campaign, 4: SystemInfo
  targetrole?: string;
  startdate?: string;
  enddate?: string;
  status: number | string;
  createtime?: string;
}

export interface PricePlanItem {
  id: number | string;
  productid?: number | string;
  code: string;
  name: string;
  description?: string;
  billingperiod: BillingPeriod | number; // BillingPeriod: 1: Monthly, 2: Yearly, 3: Custom
  price: number;
  originalprice?: number;
  currency?: string;
  status: number | string;
  displayorder?: number;
}

export interface FeatureItem {
  id: number | string;
  code: string;
  name: string;
  description?: string;
  featuretype?: FeatureValueType | number; // FeatureValueType: 1: Boolean, 2: Integer, 3: Decimal, 4: Text, 5: Unlimited
  defaultvalue?: string;
  status: number | string;
}

export interface SiteSettingItem {
  id: number | string;
  settingkey: string;
  settingvalue: string;
  settinggroup?: string;
  groupname?: string;
  description?: string;
  status?: number | string;
}

export interface AdminCompanyDemandItem extends DemandItem {
  demandid?: number | string;
  companyname?: string;
  companylogo?: string;
  companyphone?: string;
  companyid?: number | string;
  responsestatus?: number | string; // 0: Pending, 1: Accepted (Bende Var), 2: Rejected (Bende Yok)
  lastanswermessage?: string;
  readtime?: number | string;
}

export interface DailySalesAnalysisItem {
  date: string; // YYYY-MM-DD
  dateFormatted: string; // 16 Ekim 2026
  newCompaniesCount: number;
  newDemandsCount: number;
  notificationsCount: number;
  positiveResponsesCount: number; // "Bende Var"
  negativeResponsesCount: number; // "Bende Yok"
  chatMessagesCount: number;
  paymentsCount: number;
  salesCount: number; // Kesinleşen / Bulundu / Kapatılan Satış
  potentialSalesCount: number; // "Bende Var" diyerek lead oluşturanlar
  salesStatus: 'completed' | 'potential' | 'no_sale' | 'company_only' | 'no_activity';
  salesStatusLabel: string;
  salesStatusColor: string;
  salesStatusBadgeBg: string;
  conversionRate: number; // %
  notes: string;
  demands: DemandItem[];
  companyInteractions: AdminCompanyDemandItem[];
  companies: CompanyItem[];
}

export interface WeeklySalesAnalysisItem {
  weekLabel: string;
  weekNumber: number;
  year: number;
  startDateFormatted: string;
  endDateFormatted: string;
  responseRatePercent: number; // Esnaf Yanıt Oranı % / Bende Var Yanıtı %
  salesConversionRatePercent: number; // Satışa Dönüşüm Oranı %
  customerSatisfactionPercent: number; // Müşteri Memnuniyet Oranı %
  activeEngagementRatePercent: number; // Canlı Sohbet / İletişim Oranı %
  weeklyGrowthPercent: number; // Büyüme Oranı %
  totalDemands: number;
  positiveResponses: number;
  detectedSales: number;
  totalMessages: number;
  newCompanies: number;
  newUsers: number;
  weeklyNewCompanyPercent: number; // Haftalık Gelen Firma Yüzdesi %
  weeklyNewUserPercent: number; // Haftalık Gelen Kullanıcı Yüzdesi %
  weeklyPositiveResponsePercent: number; // Haftalık Talebe "Bende Var" Yanıtı Yüzdesi %
  summaryHighlight: string;
}

export interface SalesDetectionDetailItem {
  demandid: string;
  companyid: string;
  companyname: string;
  demandDescription: string;
  detectionReason: string;
  confidencePercent: number;
  matchedKeywordSnippet: string;
  date?: string;
}

export interface AdminSalesAnalysisResultEntity {
  overallResponseRatePercent: number;
  overallSalesConversionPercent: number;
  overallEngagementPercent: number;
  overallSatisfactionPercent: number;
  overallWeeklyNewCompanyPercent?: number;
  overallWeeklyNewUserPercent?: number;
  totalDetectedSalesCount: number;
  totalAnalyzedDemands: number;
  totalAnalyzedMessages: number;
  totalAnalyzedCompanies: number;
  totalAnalyzedUsers?: number;
  marketingHeadline: string;
  marketingTagline: string;
  weeklyReports: WeeklySalesAnalysisItem[];
  detectedSalesDetails: SalesDetectionDetailItem[];
}

// =============================================================================
// Canlı Talep Akışı / Borsa DTO Modelleri (GetLiveTicker)
// =============================================================================

export interface LiveTickerSummaryDto {
  totaldemands: number;
  todaydemands: number;
  matchedcount: number;
  avgresponsesec: number;
  fastestresponsesec: number;
  totalcompanies: number;
  activecitiescount: number;
}

export interface LiveTickerItemDto {
  description: string;
  categoryname: string;
  cityname?: string | null;
  districtname?: string | null;
  createtime: string;
  status: number;
  statustext: string;
  reachedcompanies: number;
  respondedcompanies: number;
  responsesec?: number | null;
  winningcompanyname?: string | null;
  hasimage: boolean;
  firstimage?: string | null;
}

export interface LiveTickerCompanyDto {
  name: string;
  category?: string;
  city?: string;
  logo?: string | null;
  bendevarcount: number;
  totalrespondedcount: number;
  badgetype: 'most_matched' | 'fastest_responder' | 'active_merchant';
  badgetext: string;
  subtext: string;
  highlightcolor: string;
}

export interface LiveTickerResponseDto {
  summary: LiveTickerSummaryDto;
  items: LiveTickerItemDto[];
  companies?: LiveTickerCompanyDto[];
}
