export interface MaintenanceConfig {
  enabled: boolean;
  mode: "popup" | "fullscreen" | "banner";
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  estimatedEndTime: string;
  contactWhatsApp: string;
  contactPhone: string;
  contactEmail: string;
  showContactButtons: boolean;
  allowDismiss: boolean;
  updatedAt: string;
}

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  enabled: false,
  mode: "popup",
  title: "We're Upgrading Banglasketch",
  titleBn: "আমাদের ওয়েবসাইট রক্ষণাবেক্ষণ চলছে",
  message: "We are currently performing scheduled maintenance to bring you a more luxurious and seamless interior design experience. We will be back shortly!",
  messageBn: "উন্নত গ্রাহক অভিজ্ঞতার লক্ষ্যে আমাদের ওয়েবসাইটটিতে সিস্টেম আপগ্রেড চলছে। খুব শীঘ্রই আমরা পুনরায় সক্রিয় হবো।",
  estimatedEndTime: "",
  contactWhatsApp: "8801712458794",
  contactPhone: "+880 1712-458794",
  contactEmail: "contact@banglasketch.com",
  showContactButtons: true,
  allowDismiss: true,
  updatedAt: new Date().toISOString(),
};
