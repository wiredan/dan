import React from "react";
import {
  LayoutDashboard,
  Store,
  Package,
  BookOpen,
  BrainCircuit,
  MessageCircle,
  Leaf,
  Settings,
  LifeBuoy,
  Twitter,
  Mail,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

export function AppSidebar(): JSX.Element {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-green-500 to-teal-500" />
          <span className="text-sm font-medium">Wiredan</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard")}>
                <Link to="/dashboard">
                  <LayoutDashboard /> <span>{t("sidebar.dashboard")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/marketplace")}>
                <Link to="/marketplace">
                  <Store /> <span>{t("sidebar.marketplace")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/orders")}>
                <Link to="/orders">
                  <Package /> <span>{t("sidebar.my_orders")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/education")}>
                <Link to="/education">
                  <BookOpen /> <span>{t("sidebar.education_hub")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.ai_tools")}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/ai/dan-assistant")}>
                <Link to="/ai/dan-assistant">
                  <MessageCircle /> <span>{t("sidebar.dan_ai_assistant")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/ai/crop-health")}>
                <Link to="/ai/crop-health">
                  <Leaf /> <span>{t("sidebar.crop_health_ai")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="mailto:dansidran@gmail.com">
                  <Mail /> <span>{t("sidebar.support")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="https://twitter.com/wilaya90" target="_blank" rel="noopener noreferrer">
                  <Twitter /> <span>{t("sidebar.twitter")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")}>
                <Link to="/settings">
                  <Settings /> <span>{t("sidebar.settings")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
