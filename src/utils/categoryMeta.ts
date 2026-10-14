import React from 'react';
import {
  HeartPulse,
  GraduationCap,
  Bus,
  ShieldAlert,
  Building2,
  ShoppingBag,
  Sparkles,
  Trees,
  Tractor,
} from 'lucide-react';
import { PointCategory } from '../types/index.ts';

export interface CategoryVisualConfig {
  label: PointCategory;
  color: string; // Tailwind text/bg color
  hexColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  shortDescription: string;
}

export const CATEGORY_CONFIG: Record<PointCategory, CategoryVisualConfig> = {
  'Saúde': {
    label: 'Saúde',
    color: 'text-rose-700',
    hexColor: '#D32F2F',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-300',
    icon: HeartPulse,
    shortDescription: 'Postos de saúde, UBS e atenção básica simulada.',
  },
  'Educação': {
    label: 'Educação',
    color: 'text-indigo-700',
    hexColor: '#303F9F',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    icon: GraduationCap,
    shortDescription: 'Escolas municipais, estaduais e creches modelo.',
  },
  'Transporte': {
    label: 'Transporte',
    color: 'text-cyan-800',
    hexColor: '#00838F',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-900',
    borderColor: 'border-cyan-300',
    icon: Bus,
    shortDescription: 'Terminais de ônibus e paradas de integração.',
  },
  'Segurança': {
    label: 'Segurança',
    color: 'text-slate-800',
    hexColor: '#37474F',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-900',
    borderColor: 'border-slate-300',
    icon: ShieldAlert,
    shortDescription: 'Bases comunitárias e núcleos de defesa civil.',
  },
  'Serviços Públicos': {
    label: 'Serviços Públicos',
    color: 'text-[#355E3B]',
    hexColor: '#355E3B',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    borderColor: 'border-[#355E3B]/40',
    icon: Building2,
    shortDescription: 'Atendimento ao cidadão, saneamento e órgãos públicos.',
  },
  'Comércio': {
    label: 'Comércio',
    color: 'text-[#BA623D]',
    hexColor: '#BA623D',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-[#BA623D]',
    borderColor: 'border-[#BA623D]/40',
    icon: ShoppingBag,
    shortDescription: 'Feiras livres, mercados e armazéns locais.',
  },
  'Lazer': {
    label: 'Lazer',
    color: 'text-amber-800',
    hexColor: '#E5B744',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    borderColor: 'border-amber-300',
    icon: Sparkles,
    shortDescription: 'Praças de convivência, ginásios e parques.',
  },
  'Meio Ambiente': {
    label: 'Meio Ambiente',
    color: 'text-emerald-800',
    hexColor: '#2E7D32',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    borderColor: 'border-emerald-300',
    icon: Trees,
    shortDescription: 'Preservação do cerrado, bacias hídricas e viveiros.',
  },
  'Rural': {
    label: 'Rural',
    color: 'text-yellow-800',
    hexColor: '#A16207',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-900',
    borderColor: 'border-yellow-300',
    icon: Tractor,
    shortDescription: 'Extensão rural, associações e agricultura familiar.',
  },
};
