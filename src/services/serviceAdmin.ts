import { apiClient } from './apiClient';
import {
  ArgResult,
  CompanyItem,
  DemandItem,
  ReportItem,
  UserItem,
  PaymentItem,
  SubscriptionItem,
  CategoryItem,
  AnnouncementItem,
  PricePlanItem,
  FeatureItem,
  SiteSettingItem,
  CompanyUserItem,
  LiveTickerResponseDto,
} from '../types';

const BV_ADMIN = '/arg-bv/bvService/Admin';
const BV_PUBLIC = '/arg-bv/bvService/Bv';
const SESSION_TOKEN = '/arg-Session/SessionService/Token';

export const serviceAdmin = {
  // ----------------------------------------------------
  // Giriş & Oturum (ARG Portal SessionService)
  // ----------------------------------------------------
  loginWithPassword: async (
    username: string,
    pass: string,
    systemCode: string = 'arg'
  ): Promise<ArgResult<any>> => {
    const payload = {
      UserName: username.trim(),
      Password: pass,
      SystemCode: (systemCode || 'arg').trim(),
    };

    return (await apiClient.post(`${SESSION_TOKEN}/Login`, payload)) as any;
  },

  // ----------------------------------------------------
  // Dashboard & Metrikler (MainWeb)
  // ----------------------------------------------------
  getDashboardSummary: async (): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/GetAdminDashboardSummary`, {});
  },

  // ----------------------------------------------------
  // Kullanıcı Yönetimi (User001)
  // ----------------------------------------------------
  getUserList: async (searchInfos: any[] = []): Promise<ArgResult<UserItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetUserList`, searchInfos);
  },

  updateUserStatus: async (user: Partial<UserItem>): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/UpdateUserStatus`, user);
  },

  banUser: async (userid: number | string, banreason: string, durationdays?: number): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/BanUser`, {
      userid: String(userid),
      banreason,
      durationdays: durationdays || null,
    });
  },

  unbanUser: async (userid: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/UnbanUser`, { userid: String(userid) });
  },

  // ----------------------------------------------------
  // Firma Yönetimi (Company001, 002, 003, 004)
  // ----------------------------------------------------
  getCompanyList: async (searchInfos: any[] = [], returnGeometry: boolean = false): Promise<ArgResult<CompanyItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetCompanyList`, { searchInfos, returnGeometry });
  },

  approveCompany: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/ApproveCompany`, { id });
  },

  rejectCompany: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/RejectCompany`, { id });
  },

  deleteCompany: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/DeleteCompany`, { id });
  },

  banCompany: async (companyid: number | string, banreason: string, durationdays?: number): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/BanCompany`, {
      companyid: String(companyid),
      banreason,
      durationdays: durationdays || null,
    });
  },

  unbanCompany: async (companyid: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/UnbanCompany`, { companyid: String(companyid) });
  },

  saveCompany: async (company: Partial<CompanyItem>): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/SaveCompanyAdmin`, company);
  },

  getCompanyUsers: async (companyid: number | string): Promise<ArgResult<CompanyUserItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetCompanyUserByCompanyId`, { companyid: String(companyid) });
  },

  saveCompanyUser: async (item: Partial<CompanyUserItem>): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/SaveCompanyUserAdmin`, item);
  },

  deleteCompanyUser: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/DeleteCompanyUserByIdAdmin`, { id });
  },

  updateCompanyUserRole: async (id: number | string, companyid: number | string, role: string | number): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/UpdateCompanyUserRole`, { id, companyid, role });
  },

  // ----------------------------------------------------
  // Talep Yönetimi (Demand001)
  // ----------------------------------------------------
  getDemandList: async (
    searchInfos: any[] = [],
    returnGeometry: boolean = false,
    options?: { statuses?: number[]; limit?: number; offset?: number }
  ): Promise<ArgResult<DemandItem[]>> => {
    const body: any = { searchInfos, returnGeometry };
    if (options?.statuses && options.statuses.length > 0) body.statuses = options.statuses;
    if (options?.limit) body.limit = options.limit;
    if (options?.offset) body.offset = options.offset;
    return apiClient.post(`${BV_ADMIN}/GetDemandList`, body);
  },

  approveDemand: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/ApproveDemand`, { id });
  },

  rejectDemand: async (id: number | string, reason: string = ''): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/RejectDemand`, { id, reason });
  },

  deleteDemand: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/DeleteDemand`, { id });
  },

  getDemandCompanies: async (demandid: number | string): Promise<ArgResult<CompanyItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetDemandCompanies`, { demandid: String(demandid) });
  },

  getDemandCompanyList: async (): Promise<ArgResult<any[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetDemandCompanyList`, {});
  },

  getCompanyDemandList: async (): Promise<ArgResult<any[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetCompanyDemandList`, {});
  },

  getAllDemandAnswers: async (): Promise<ArgResult<any[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetAllDemandAnswers`, {});
  },

  getSalesAndDemandAnalysis: async (): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/GetSalesAndDemandAnalysis`, {});
  },

  // ----------------------------------------------------
  // Şikayet & Moderasyon (Report001)
  // ----------------------------------------------------
  getReportList: async (status?: number): Promise<ArgResult<ReportItem[]>> => {
    const payload: any = {};
    if (status !== undefined && status !== null) {
      payload.status = status;
    }
    return apiClient.post(`${BV_ADMIN}/GetReportList`, payload);
  },

  resolveReport: async (
    id: number | string,
    status: number,
    actiontype: number = 0,
    adminnote: string = ''
  ): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/ResolveReport`, {
      id,
      reportid: id,
      status,
      actiontype,
      adminnote,
    });
  },

  // ----------------------------------------------------
  // Ödeme & Abonelik (Payment001)
  // ----------------------------------------------------
  getPaymentList: async (): Promise<ArgResult<PaymentItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetAdminPaymentList`, {});
  },

  getSubscriptionList: async (): Promise<ArgResult<SubscriptionItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetAdminSubscriptionList`, {});
  },

  // ----------------------------------------------------
  // Kategori Yönetimi (Category001, Category002)
  // ----------------------------------------------------
  getCategoryList: async (): Promise<ArgResult<CategoryItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetCategoryList`, {});
  },

  saveCategory: async (category: Partial<CategoryItem>): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/SaveCategoryAdmin`, category);
  },

  deleteCategory: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/DeleteCategorybyId`, { id });
  },

  // ----------------------------------------------------
  // Fiyat Planları & Paketler (Product001, PricePlan002, Feature002)
  // ----------------------------------------------------
  getPricePlanList: async (): Promise<ArgResult<PricePlanItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetPricePlanList`, {});
  },

  savePricePlan: async (plan: Partial<PricePlanItem>): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/SavePricePlanAdmin`, plan);
  },

  deletePricePlan: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/DeletePricePlanAdmin`, { id });
  },

  getFeatureList: async (): Promise<ArgResult<FeatureItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetFeatureList`, {});
  },

  getPricePlanFeatures: async (priceplanid: number | string): Promise<ArgResult<any[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetPricePlanFeatures`, { priceplanid: String(priceplanid) });
  },

  // ----------------------------------------------------
  // Duyuru Yönetimi (Announcement001)
  // ----------------------------------------------------
  getAnnouncementList: async (status?: number): Promise<ArgResult<AnnouncementItem[]>> => {
    const payload: any = {};
    if (status !== undefined) payload.status = status;
    return apiClient.post(`${BV_ADMIN}/GetAnnouncementList`, payload);
  },

  saveAnnouncement: async (item: Partial<AnnouncementItem>): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/SaveAnnouncement`, item);
  },

  deleteAnnouncement: async (id: number | string): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/DeleteAnnouncement`, { id });
  },

  // ----------------------------------------------------
  // Sistem / Site Ayarları (SiteSetting001)
  // ----------------------------------------------------
  getSiteSettingList: async (): Promise<ArgResult<SiteSettingItem[]>> => {
    return apiClient.post(`${BV_ADMIN}/GetSiteSettingList`, {});
  },

  saveSiteSettings: async (settings: SiteSettingItem[]): Promise<ArgResult<any>> => {
    return apiClient.post(`${BV_ADMIN}/SaveSiteSettings`, settings);
  },

  // ----------------------------------------------------
  // Canlı Talep Akışı / Borsa (GetLiveTicker)
  // ----------------------------------------------------
  getLiveTicker: async (limit: number = 50): Promise<ArgResult<LiveTickerResponseDto>> => {
    return apiClient.get(`${BV_PUBLIC}/GetLiveTicker?limit=${limit}`);
  },
};


