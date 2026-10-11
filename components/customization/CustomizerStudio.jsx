'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { formatINR, PRICING_RULES } from '@/lib/pricing';
import { 
  Type, 
  Upload, 
  RotateCw, 
  Trash2, 
  Check, 
  Sparkles, 
  Eye, 
  Move, 
  Palette, 
  Layers, 
  Info,
  ShoppingBag
} from 'lucide-react';

const FONTS = [
  { name: 'Cinzel (Monogram Serif)', value: "'Cinzel', Georgia, serif" },
  { name: 'Playfair (Luxury Serif)', value: "'Playfair Display', serif" },
  { name: 'Inter (Modern Clean)', value: "'Inter', sans-serif" },
  { name: 'Montserrat (Bold Clean)', value: "'Montserrat', sans-serif" },
  { name: 'Courier (Vintage Type)', value: "'Courier New', monospace" },
];

const TEXT_COLORS = [
  { name: 'Crisp White', hex: '#FFFFFF' },
  { name: 'Jet Black', hex: '#111827' },
  { name: 'Imperial Gold', hex: '#D4AF37' },
  { name: 'Silver Slate', hex: '#94A3B8' },
  { name: 'Royal Navy', hex: '#1E3A8A' },
  { name: 'Burgundy Crimson', hex: '#991B1B' },
];

export default function CustomizerStudio({ product, initialVariant = null }) {
  const router = useRouter();
  const { addToCart } = useStore();

  // Selected Variant options
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(
    initialVariant || variants[0] || null
  );

  const isTshirt = product.category?.slug === 't-shirts';

  // Customization State
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [placement, setPlacement] = useState('front_chest'); // 'front_chest' | 'center_front' | 'back'
  const [shirtColor, setShirtColor] = useState({
    name: selectedVariant?.colorName || 'Pure White',
    hex: selectedVariant?.colorHex || '#FFFFFF',
  });

  // Custom Text State
  const [customText, setCustomText] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState(TEXT_COLORS[1].hex);
  const [textSize, setTextSize] = useState(24);
  const [textAlign, setTextAlign] = useState('center');
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });

  // Logo State
  const [logoAsset, setLogoAsset] = useState(null);
  const [logoScale, setLogoScale] = useState(60);
  const [logoRotation, setLogoRotation] = useState(0);
  const [logoOffset, setLogoOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // UI feedback
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Sync shirt color if user changes variant
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setShirtColor({
      name: variant.colorName,
      hex: variant.colorHex,
    });
  };

  // Pricing calculation
  const basePrice = (product.salePrice ?? product.basePrice) + (selectedVariant?.priceAdjustment ?? 0);
  const hasText = customText.trim().length > 0;
  const hasLogo = Boolean(logoAsset);
  const isBack = placement === 'back';

  let customFee = 0;
  if (hasText) customFee += PRICING_RULES.CUSTOM_TEXT_FEE;
  if (hasLogo) customFee += PRICING_RULES.LOGO_PRINTING_FEE;
  if (isBack && (hasText || hasLogo)) customFee += PRICING_RULES.ADDITIONAL_PLACEMENT_FEE;

  const totalCalculatedPrice = basePrice + customFee;

  // Handle placement change: if back chosen, flip view to back
  const handlePlacementChange = (newPlacement) => {
    setPlacement(newPlacement);
    if (newPlacement === 'back') {
      setView('back');
    } else if (view === 'back') {
      setView('front');
    }
  };

  // Upload logo handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadError('Only PNG, JPEG, or WebP files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be smaller than 5MB.');
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setLogoAsset(data.asset);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Save custom design and add to cart
  const handleSaveAndAddToCart = async () => {
    if (!selectedVariant) {
      alert('Please select a size and variant.');
      return;
    }

    setSaving(true);
    setFeedbackMsg('');

    try {
      const structuredDesign = {
        productId: product.id,
        variantId: selectedVariant.id,
        designName: `${product.name} - ${customText ? `"${customText}"` : 'Custom Edition'}`,
        placement,
        shirtColorHex: shirtColor.hex,
        shirtColorName: shirtColor.name,
        textConfig: hasText
          ? {
              text: customText,
              font: selectedFont,
              color: textColor,
              size: textSize,
              align: textAlign,
              offset: textOffset,
            }
          : null,
        logoAssetId: logoAsset?.id || null,
        canvasState: {
          view,
          placement,
          logoScale,
          logoRotation,
          logoOffset,
          textOffset,
        },
        previewUrl: logoAsset?.fileUrl || null,
      };

      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structuredDesign),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save design');

      // Add to Cart
      const cartRes = await addToCart({
        variantId: selectedVariant.id,
        customDesignId: data.design.id,
        quantity: 1,
      });

      if (!cartRes.success) throw new Error(cartRes.error || 'Failed to add to cart');

      setFeedbackMsg('Customized shirt added to cart!');
      setTimeout(() => {
        router.push('/cart');
      }, 800);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset design
  const handleResetDesign = () => {
    setCustomText('');
    setLogoAsset(null);
    setTextOffset({ x: 0, y: 0 });
    setLogoOffset({ x: 0, y: 0 });
    setPlacement('front_chest');
    setView('front');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>ThreadCraft Interactive Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Personalize {product.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose your size, monogram initials, quotes, or upload your insignia.
          </p>
        </div>

        {/* View Toggle (Front / Back) */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setView('front')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              view === 'front'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Front View
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              view === 'back'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Back View
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Interactive Visual Canvas Mockup (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-12 relative min-h-[540px] shadow-sm">
          {/* Mockup Badge */}
          <div className="absolute top-4 left-4 text-[11px] font-semibold text-slate-400 bg-white/80 px-3 py-1 rounded-full border border-slate-200 flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Interactive 2D Preview ({view.toUpperCase()})</span>
          </div>

          {/* Reset button */}
          {(hasText || hasLogo) && (
            <button
              onClick={handleResetDesign}
              className="absolute top-4 right-4 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Canvas</span>
            </button>
          )}

          {/* SVG Shirt Mockup Container */}
          <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
            {/* SVG Vector Base Shirt */}
            <svg
              viewBox="0 0 500 550"
              className="w-full h-full shirt-shadow transition-colors duration-300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="fabricShading" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
                </filter>
              </defs>

              {/* Shirt Body Outline with Dynamic Fill */}
              {isTshirt ? (
                // Crewneck T-Shirt Path
                <g filter="url(#fabricShading)">
                  {/* Torso & Sleeves */}
                  <path
                    d="M 160 50 L 100 90 L 50 170 L 110 200 L 130 160 L 130 490 L 370 490 L 370 160 L 390 200 L 450 170 L 400 90 L 340 50 C 310 90 190 90 160 50 Z"
                    fill={shirtColor.hex}
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                  />
                  {/* Ribbed Collar */}
                  {view === 'front' ? (
                    <path
                      d="M 160 50 C 190 100 310 100 340 50 C 315 75 185 75 160 50 Z"
                      fill="#F1F5F9"
                      stroke="#94A3B8"
                      strokeWidth="2"
                    />
                  ) : (
                    <path
                      d="M 160 50 C 200 65 300 65 340 50 C 315 58 185 58 160 50 Z"
                      fill="#F1F5F9"
                      stroke="#94A3B8"
                      strokeWidth="2"
                    />
                  )}
                  {/* Subtle Hem stitch */}
                  <line x1="135" y1="475" x2="365" y2="475" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 2" />
                </g>
              ) : (
                // Formal Shirt Path
                <g filter="url(#fabricShading)">
                  {/* Torso & Sleeves */}
                  <path
                    d="M 170 50 L 110 90 L 40 180 L 100 210 L 130 170 L 130 500 C 200 520 300 520 370 500 L 370 170 L 400 210 L 460 180 L 390 90 L 330 50 Z"
                    fill={shirtColor.hex}
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                  />
                  {/* Placket & Buttons (Front View only) */}
                  {view === 'front' && (
                    <g>
                      <rect x="238" y="70" width="24" height="430" fill="#E2E8F0" opacity="0.6" />
                      <line x1="238" y1="70" x2="238" y2="500" stroke="#94A3B8" strokeWidth="1" />
                      <line x1="262" y1="70" x2="262" y2="500" stroke="#94A3B8" strokeWidth="1" />
                      {/* Buttons */}
                      <circle cx="250" cy="110" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
                      <circle cx="250" cy="170" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
                      <circle cx="250" cy="230" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
                      <circle cx="250" cy="290" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
                      <circle cx="250" cy="350" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
                      <circle cx="250" cy="410" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
                    </g>
                  )}
                  {/* Formal Collar */}
                  {view === 'front' ? (
                    <g>
                      <polygon points="170,50 250,95 210,120 170,50" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                      <polygon points="330,50 250,95 290,120 330,50" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                    </g>
                  ) : (
                    <path d="M 170 50 C 220 70 280 70 330 50 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                  )}
                </g>
              )}
            </svg>

            {/* PRINT AREA OVERLAY */}
            {/* Front Chest Monogram Region */}
            {view === 'front' && placement === 'front_chest' && (
              <div
                className="absolute top-[28%] left-[60%] w-[26%] h-[20%] print-area-active rounded-lg flex flex-col items-center justify-center p-2 text-center pointer-events-none transition-all"
                title="Left Chest Monogram Print Area"
              >
                {/* Custom Text inside region */}
                {hasText && (
                  <div
                    style={{
                      fontFamily: selectedFont,
                      color: textColor,
                      fontSize: `${Math.round(textSize * 0.7)}px`,
                      textAlign: textAlign,
                      transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                    }}
                    className="leading-tight font-semibold tracking-wide drop-shadow-sm select-none"
                  >
                    {customText}
                  </div>
                )}

                {/* Uploaded Logo inside region */}
                {hasLogo && (
                  <div
                    style={{
                      width: `${logoScale}%`,
                      transform: `translate(${logoOffset.x}px, ${logoOffset.y}px) rotate(${logoRotation}deg)`,
                    }}
                    className="mt-1 flex items-center justify-center select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoAsset.fileUrl}
                      alt="Custom Insignia"
                      className="max-h-14 object-contain filter drop-shadow-sm"
                    />
                  </div>
                )}

                {!hasText && !hasLogo && (
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                    Chest Monogram Area
                  </span>
                )}
              </div>
            )}

            {/* Center Front Graphic Region */}
            {view === 'front' && placement === 'center_front' && (
              <div
                className="absolute top-[26%] left-[32%] w-[36%] h-[36%] print-area-active rounded-xl flex flex-col items-center justify-center p-3 text-center pointer-events-none transition-all"
                title="Center Front Graphic Print Area"
              >
                {/* Uploaded Logo */}
                {hasLogo && (
                  <div
                    style={{
                      width: `${logoScale}%`,
                      transform: `translate(${logoOffset.x}px, ${logoOffset.y}px) rotate(${logoRotation}deg)`,
                    }}
                    className="flex items-center justify-center select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoAsset.fileUrl}
                      alt="Custom Graphic"
                      className="max-h-28 object-contain filter drop-shadow-sm"
                    />
                  </div>
                )}

                {/* Custom Text */}
                {hasText && (
                  <div
                    style={{
                      fontFamily: selectedFont,
                      color: textColor,
                      fontSize: `${textSize}px`,
                      textAlign: textAlign,
                      transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                    }}
                    className="mt-2 font-bold tracking-wide drop-shadow-sm select-none"
                  >
                    {customText}
                  </div>
                )}

                {!hasText && !hasLogo && (
                  <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">
                    Center Graphic Area
                  </span>
                )}
              </div>
            )}

            {/* Back Print Region */}
            {view === 'back' && placement === 'back' && (
              <div
                className="absolute top-[22%] left-[26%] w-[48%] h-[42%] print-area-active rounded-xl flex flex-col items-center justify-center p-4 text-center pointer-events-none transition-all"
                title="Back Print Area"
              >
                {/* Logo */}
                {hasLogo && (
                  <div
                    style={{
                      width: `${logoScale}%`,
                      transform: `translate(${logoOffset.x}px, ${logoOffset.y}px) rotate(${logoRotation}deg)`,
                    }}
                    className="flex items-center justify-center select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoAsset.fileUrl}
                      alt="Back Print"
                      className="max-h-32 object-contain filter drop-shadow-sm"
                    />
                  </div>
                )}

                {/* Text */}
                {hasText && (
                  <div
                    style={{
                      fontFamily: selectedFont,
                      color: textColor,
                      fontSize: `${textSize}px`,
                      textAlign: textAlign,
                      transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                    }}
                    className="mt-2 font-bold tracking-wider select-none"
                  >
                    {customText}
                  </div>
                )}

                {!hasText && !hasLogo && (
                  <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">
                    Back Print Area
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-400 text-center max-w-sm flex items-center justify-center space-x-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Printed via high-definition DTG & Japanese embroidery machinery.</span>
          </div>
        </div>

        {/* Right Column: Customization Controls & Purchase Box (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Size & Variant Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
              <span>1. Choose Size & Fit</span>
              <span className="text-xs font-normal text-slate-500">
                In Stock: {selectedVariant?.stock ?? 0}
              </span>
            </h3>

            {/* Fit Options */}
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(variants.map((v) => v.fit))).map((fit) => (
                <button
                  key={fit}
                  onClick={() => {
                    const match = variants.find((v) => v.fit === fit && v.colorName === shirtColor.name);
                    if (match) setSelectedVariant(match);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    selectedVariant?.fit === fit
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>

            {/* Sizes */}
            <div className="grid grid-cols-5 gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                const match = variants.find(
                  (v) => v.size === size && v.fit === selectedVariant?.fit && v.colorName === shirtColor.name
                );
                const isAvailable = match && match.stock > 0;
                const isSelected = selectedVariant?.size === size;

                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => match && handleVariantChange(match)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200'
                        : isAvailable
                        ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Colors */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-600 block mb-2">
                Fabric Color: <span className="font-semibold text-slate-900">{shirtColor.name}</span>
              </label>
              <div className="flex items-center space-x-3">
                {Array.from(new Set(variants.map((v) => v.colorName))).map((cName) => {
                  const match = variants.find((v) => v.colorName === cName);
                  if (!match) return null;
                  const isSelected = shirtColor.name === cName;

                  return (
                    <button
                      key={cName}
                      onClick={() => handleVariantChange(match)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        isSelected ? 'ring-2 ring-amber-500 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: match.colorHex }}
                      title={cName}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Print Placement Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>2. Print Placement</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePlacementChange('front_chest')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                  placement === 'front_chest'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Left Chest
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Monogram / Crest</span>
              </button>

              <button
                onClick={() => handlePlacementChange('center_front')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                  placement === 'center_front'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Center Front
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Main Graphic</span>
              </button>

              <button
                onClick={() => handlePlacementChange('back')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                  placement === 'back'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Back Print
                <span className="block text-[10px] text-amber-700 font-medium mt-0.5">+₹150 fee</span>
              </button>
            </div>
          </div>

          {/* 3. Custom Text / Monogram */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-amber-600" />
                <span>3. Add Text / Monogram</span>
              </span>
              <span className="text-xs font-semibold text-amber-700">
                {hasText ? `+₹${PRICING_RULES.CUSTOM_TEXT_FEE}` : 'Optional (+₹199)'}
              </span>
            </h3>

            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. A.S. or 'ThreadCraft 2026'"
              maxLength={30}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />

            {hasText && (
              <div className="space-y-3 pt-2">
                {/* Font Selector */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Font Typography</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {FONTS.map((f) => (
                      <option key={f.name} value={f.value}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Color Swatches */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Thread Color</label>
                  <div className="flex items-center space-x-2">
                    {TEXT_COLORS.map((tc) => (
                      <button
                        key={tc.name}
                        onClick={() => setTextColor(tc.hex)}
                        className={`w-6 h-6 rounded-full border ${
                          textColor === tc.hex ? 'ring-2 ring-amber-500 scale-110' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: tc.hex }}
                        title={tc.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Text Size</span>
                    <span className="font-semibold">{textSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="40"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Logo / Insignia Upload */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>4. Upload Logo / Graphic</span>
              </span>
              <span className="text-xs font-semibold text-amber-700">
                {hasLogo ? `+₹${PRICING_RULES.LOGO_PRINTING_FEE}` : 'Optional (+₹299)'}
              </span>
            </h3>

            {logoAsset ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center space-x-3 truncate">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoAsset.fileUrl}
                    alt="Logo thumbnail"
                    className="w-10 h-10 object-contain bg-white rounded border border-slate-200 p-1"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {logoAsset.originalName}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">Uploaded & Ready</p>
                  </div>
                </div>

                <button
                  onClick={() => setLogoAsset(null)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                  title="Remove logo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-amber-50/30">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-slate-700">
                    {uploading ? 'Processing & Validating...' : 'Click to Upload PNG or JPEG'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Transparent PNG recommended (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploadError && (
                  <p className="text-xs text-rose-600 mt-1.5">{uploadError}</p>
                )}
              </div>
            )}

            {hasLogo && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Logo Scale</span>
                    <span className="font-semibold">{logoScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={logoScale}
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Authoritative Price Breakdown & Purchase Action */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Price Breakdown (INR)
            </h4>

            <div className="space-y-2 text-xs border-b border-slate-800 pb-3">
              <div className="flex justify-between text-slate-300">
                <span>Base Garment ({product.name})</span>
                <span>{formatINR(basePrice)}</span>
              </div>
              {hasText && (
                <div className="flex justify-between text-slate-300">
                  <span>Custom Monogram / Text</span>
                  <span>+{formatINR(PRICING_RULES.CUSTOM_TEXT_FEE)}</span>
                </div>
              )}
              {hasLogo && (
                <div className="flex justify-between text-slate-300">
                  <span>Logo / Insignia Printing</span>
                  <span>+{formatINR(PRICING_RULES.LOGO_PRINTING_FEE)}</span>
                </div>
              )}
              {isBack && (hasText || hasLogo) && (
                <div className="flex justify-between text-slate-300">
                  <span>Back Placement Surcharge</span>
                  <span>+{formatINR(PRICING_RULES.ADDITIONAL_PLACEMENT_FEE)}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-sm font-medium text-slate-200">Total Price</span>
              <span className="text-2xl font-bold text-amber-400 font-serif">
                {formatINR(totalCalculatedPrice)}
              </span>
            </div>

            {feedbackMsg && (
              <div className="p-2.5 bg-emerald-900/60 border border-emerald-600 rounded-lg text-emerald-300 text-xs font-medium text-center">
                ✓ {feedbackMsg}
              </div>
            )}

            <button
              onClick={handleSaveAndAddToCart}
              disabled={saving || !selectedVariant || selectedVariant.stock === 0}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{saving ? 'Saving Customization...' : 'Save Design & Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
