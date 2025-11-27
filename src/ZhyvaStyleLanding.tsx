import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  useSpring,
  useInView,
} from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Menu, X, ChevronRight, Sparkles, Heart, ShieldCheck, Users,
  ChevronLeft, MoveRight, Paintbrush, Phone, Star
} from "lucide-react";
import { animate as popAnimate, inertia } from "popmotion";

// THREE
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* --------------------------------
 * helpers / variants
 * -------------------------------- */
const EASE = [0.16, 1, 0.3, 1] as const;

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const Section: React.FC<{ id?: string; className?: string; children: React.ReactNode }>
  = ({ id, className = "", children }) => (
  <section id={id} className={`section relative snap-start ${className}`}>{children}</section>
);

/* Пилюлі с «магнітом» */
const Pill: React.FC<{ children: React.ReactNode; onClick?: () => void; variant?: "light" | "dark" }>
  = ({ children, onClick, variant = "light" }) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const span = el.querySelector("span");
    const enter = () => el.classList.add("magnet");
    const leave = () => { el.classList.remove("magnet"); if (span) (span as HTMLElement).style.transform = "translate(0,0)"; };
    const move = (e: MouseEvent) => {
      if (!span) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) * 0.06;
      const dy = (e.clientY - (r.top + r.height/2)) * 0.06;
      (span as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
    };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    el.addEventListener("mousemove", move);
    return ()=>{ el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); el.removeEventListener("mousemove", move); };
  }, []);
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`pill ${variant === "light" ? "pill-light" : "pill-dark"} magnet`}
    >
      <span>{children}</span>
    </motion.button>
  );
};

/* Tilt-карточка */
const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const max = 10;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -max;
      const ry = (px - 0.5) * max;
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const reset = () => { el.style.transform = "rotateX(0deg) rotateY(0deg)"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return ()=>{ el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", reset); };
  }, []);
  return <div className={`tilt ${className}`} ref={ref}><div className="tilt-inner">{children}</div></div>;
};

/* --------------------------------
 * Direction types/data
 * -------------------------------- */
type Direction = {
  key: "podology" | "cosmetology" | "massage";
  title: string;
  short: string;
  img: string;          // обложка
  images: string[];     // мини-галерея
  bullets: string[];
  long: string;
};

const directions: Direction[] = [
  {
    key: "podology",
    title: "Подологія",
    short: "Професійний догляд за стопами: мозолі, тріщини, врослі нігті, індивідуальні устілки.",
    img: "https://onclinic.ua/storage/media/articles/959/DEDdO1AcJltylqOQdLOQUr6toQonSjSo1ByzQ3Bl.jpg",
    images: [
      "https://onclinic.ua/storage/media/articles/959/DEDdO1AcJltylqOQdLOQUr6toQonSjSo1ByzQ3Bl.jpg",
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1531829039722-d3fb3e705a4b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop"
    ],
    bullets: [
      "Видалення мозолів / натоптишів",
      "Догляд за тріщинами п’ят",
      "Корекція врослого нігтя",
      "Діагностика грибкових уражень",
      "Індивідуальні ортопедичні устілки",
      "Іонофорез від пітливості",
    ],
    long:
      "Працюємо навіть зі складними випадками. Використовуємо стерильні інструменти та делікатні методики, щоб повернути комфорт та естетику стопам.",
  },
  {
    key: "cosmetology",
    title: "Косметологія",
    short: "Підкреслюємо природну красу: ін'єкційні та доглядові процедури, natural-look без перебільшень.",
    img: "https://framerusercontent.com/images/gPGLSfwfiIK7Hm7Z1VTzORpc.jpg?width=826&height=551",
    images: [
      "https://framerusercontent.com/images/gPGLSfwfiIK7Hm7Z1VTzORpc.jpg?width=826&height=551",
      "https://images.unsplash.com/photo-1599158150601-2691e048d1db?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1554647286-f365d7defc01?q=80&w=1200&auto=format&fit=crop"
    ],
    bullets: [
      "Корекція губ / бланшинг зморшок",
      "Векторний ліфтинг (Radiesse)",
      "Полінуклеотиди (Rejuran, Vitarian)",
      "Ботулінотерапія (Xeomin, Botox)",
      "Біорепарація (Yalupro Super Hydro)",
      "Чистки, пілінги (PRX-T33, Retix, PCA)",
    ],
    long:
      "Протоколи з акцентом на здоров’я шкіри. Підбираємо індивідуальні плани з урахуванням типу, чутливості та бажаного результату.",
  },
  {
    key: "massage",
    title: "Масаж",
    short: "Релакс та відновлення: авторські техніки, лімфодренаж, масаж для вагітних.",
    img: "https://royalthaispa.com.ua/thumbs/sglsbg/media/sgls/2324/70dloIwm5uFUeXWn37yn3ysdXXBkHxLMnFnYQlaC.jpg",
    images: [
      "https://royalthaispa.com.ua/thumbs/sglsbg/media/sgls/2324/70dloIwm5uFUeXWn37yn3ysdXXBkHxLMnFnYQlaC.jpg",
      "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=1200&auto=format&fit=crop",
      "https://vettaspa.com/wp-content/uploads/2024/11/vetta-nordic-spa-duo-massage.jpg",
      "https://images.unsplash.com/photo-1546539782-6fc531453083?q=80&w=1200&auto=format&fit=crop"
    ],
    bullets: [
      "Лімфодренаж, робота з фасціями",
      "Авторський масаж обличчя",
      "Екопластика тіла, blades-техніки",
      "Лікувальний масаж (dry needle)",
      "Протоколи для вагітних",
    ],
    long:
      "Знімаємо напругу, покращуємо кровообіг і якість відновлення. Допомагаємо з болем у спині та загальним тонусом.",
  },
];

/* --------------------------------
 * Карточка-напряму (исправленное отображение фото)
 * -------------------------------- */
const DirectionCard: React.FC<{
  item: Direction;
  onOpen: (d: Direction) => void;
  viewportRoot?: Element | null;   // кастомный root для whileInView
}> = ({ item, onOpen, viewportRoot }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const isInViewRaw = useInView(wrapRef, {
    // useInView ожидает root как RefObject<Element> | Element | undefined
    root: viewportRoot ? ({ current: viewportRoot } as React.RefObject<Element>) : undefined,
    amount: 0.5,
    once: true,
  });
  const shouldReveal = viewportRoot ? isInViewRaw : true;

  return (
    <TiltCard className="group">
      <motion.div
        ref={wrapRef}
        variants={fadeUp}
        whileHover={{ y: -4 }}
        className="card reveal"
        onClick={() => onOpen(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') onOpen(item); }}
      >
        <div className="mask-reveal w-full h-56 will-change-transform">
          <motion.img
            src={item.img}
            alt={item.title}
            className="w-full h-56 object-cover img-skeleton"
            loading="lazy"
            onError={(e)=>{ (e.currentTarget as HTMLImageElement).src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1600&auto=format&fit=crop"; }}
            style={{
              clipPath: shouldReveal ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path .8s cubic-bezier(.22,1,.36,1)",
            }}
          />
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-stone-900 tracking-tight">{item.title}</h3>
          <p className="mt-2 text-stone-600 leading-relaxed">{item.short}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-amber-900 font-semibold">
            Детальніше <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
};

/* --------------------------------
 * Модалка напряму
 * -------------------------------- */
const DirectionModal: React.FC<{
  open: boolean;
  direction?: Direction | null;
  onClose: () => void;
  onBook: () => void;
}> = ({ open, direction, onClose, onBook }) => {
  // hooks — безусловно и в одном порядке
  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  useEffect(() => {
    if (!direction) return;
    setCurrentImg(0);
  }, [direction]);

  const sections = useMemo(() => ([
    { id: "sec-overview", label: "Опис" },
    { id: "sec-services", label: "Послуги" },
    { id: "sec-faq", label: "FAQ" },
  ]), []);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const targets = sections.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!targets.length) return;
    const io = new IntersectionObserver((entries) => {
      const vis = [...entries].sort((a,b)=>b.intersectionRatio - a.intersectionRatio)[0];
      if (vis?.isIntersecting) {
        const idx = targets.findIndex(t => t === vis.target);
        if (idx >= 0) setActiveIdx(idx);
      }
    }, { root, threshold: [0.51, 0.75] });
    targets.forEach(t => io.observe(t));
    return ()=>io.disconnect();
  }, [sections]);

  const scrollToSec = (id: string) => {
    const el = document.getElementById(id);
    if (!el || !bodyRef.current) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const show = open && !!direction;

  return (
    <AnimatePresence>
      {show && direction && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e)=>{ if (e.currentTarget === e.target) onClose(); }}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dir-title"
            initial={{ y: 24, opacity: .6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            {/* заголовок */}
            <div className="modal-header">
              <div className="font-bold text-lg" id="dir-title" style={{ fontFamily: "Playfair Display, serif" }}>
                {direction.title}
              </div>
              <button className="modal-close" aria-label="Закрити" onClick={onClose}><X className="w-5 h-5" /></button>
            </div>

            {/* главная картинка */}
            <div className="main-img-wrap w-full h-[320px] overflow-hidden">
              <motion.img
                key={direction.images[currentImg]}
                src={direction.images[currentImg]}
                alt={direction.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: .6, ease: EASE }}
                onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = direction.img; }}
              />
            </div>

            {/* превью-галерея */}
            <div className="thumb-row">
              {direction.images.map((src, i) => (
                <button
                  key={src}
                  className={`thumb ${i===currentImg ? "active": ""}`}
                  onClick={()=>setCurrentImg(i)}
                  aria-label={`Зображення ${i+1}`}
                >
                  <img src={src} className="w-full h-full object-cover" alt={`thumb-${i+1}`} loading="lazy"
                    onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = direction.img; }}
                  />
                </button>
              ))}
            </div>

            {/* sticky tabs */}
            <div className="modal-tabs">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  className={`modal-tab ${i===activeIdx ? "active" : ""}`}
                  onClick={()=>scrollToSec(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* тело с секциями — скроллим внутри */}
            <div ref={bodyRef} className="modal-body" style={{ maxHeight: "46vh", overflow: "auto" }}>
              {/* ОПИС */}
              <section id="sec-overview" className="modal-section">
                <h4 className="text-xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>Опис</h4>
                <p className="text-stone-700 leading-relaxed mt-2">{direction.long}</p>
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {direction.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-amber-900" />
                      <span className="text-stone-800">{b}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ПОСЛУГИ */}
              <section id="sec-services" className="modal-section mt-8">
                <h4 className="text-xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>Послуги</h4>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {direction.key === "podology" && (
                    <>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Корекція врослого нігтя</b><div className="text-sm text-stone-600 mt-1">Безпечно та майже безболісно, з профілактикою рецидивів.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Індивідуальні устілки</b><div className="text-sm text-stone-600 mt-1">Зменшення болю та правильний розподіл навантаження.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Іонофорез</b><div className="text-sm text-stone-600 mt-1">Контроль пітливості з тривалим ефектом.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Лікування тріщин</b><div className="text-sm text-stone-600 mt-1">Загоєння та догляд за шкірою п’ят.</div></div>
                    </>
                  )}
                  {direction.key === "cosmetology" && (
                    <>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Бланшинг зморшок</b><div className="text-sm text-stone-600 mt-1">Belotero Soft / Balance для делікатних зон.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Векторний ліфтинг</b><div className="text-sm text-stone-600 mt-1">Radiesse — щільність і каркас.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Полінуклеотиди</b><div className="text-sm text-stone-600 mt-1">Rejuran, Vitarian — якість шкіри.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Пілінги</b><div className="text-sm text-stone-600 mt-1">PRX-T33, Retix, PCA — безпечно й послідовно.</div></div>
                    </>
                  )}
                  {direction.key === "massage" && (
                    <>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Лімфодренаж</b><div className="text-sm text-stone-600 mt-1">Зняття набряків, легкість і тонус.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Blades-техніки</b><div className="text-sm text-stone-600 mt-1">Робота з фасціями, м’язами та затисками.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Масаж для вагітних</b><div className="text-sm text-stone-600 mt-1">Делікатні протоколи для комфорту.</div></div>
                      <div className="rounded-2xl border p-4 shadow-soft bg-white"><b>Dry needle</b><div className="text-sm text-stone-600 mt-1">Точкове розслаблення тригерів.</div></div>
                    </>
                  )}
                </div>
              </section>

              {/* FAQ */}
              <section id="sec-faq" className="modal-section mt-8">
                <h4 className="text-xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>FAQ</h4>
                <div className="mt-3 space-y-3">
                  <details className="rounded-2xl border p-4 bg-white">
                    <summary className="font-semibold cursor-pointer">Це боляче?</summary>
                    <p className="text-sm text-stone-700 mt-2">Використовуються делікатні техніки та місцева анестезія за потреби.</p>
                  </details>
                  <details className="rounded-2xl border p-4 bg-white">
                    <summary className="font-semibold cursor-pointer">Скільки триває процедура?</summary>
                    <p className="text-sm text-stone-700 mt-2">Від 30 до 90 хв залежно від послуги та індивідуальних факторів.</p>
                  </details>
                  <details className="rounded-2xl border p-4 bg-white">
                    <summary className="font-semibold cursor-pointer">Які протипоказання?</summary>
                    <p className="text-sm text-stone-700 mt-2">Уточнюємо на консультації: стан шкіри, хронічні захворювання, вагітність тощо.</p>
                  </details>
                </div>

                <div className="mt-6 rounded-2xl border p-4 shadow-soft bg-white">
                  <div className="font-semibold">Готові записатися?</div>
                  <button className="btn btn-primary mt-3" onClick={onBook}>Записатися</button>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* --------------------------------
 * THREE scene
 * -------------------------------- */
function Particles({ count = 2400 }) {
  const ref = React.useRef<THREE.Points>(null);
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2;
      pos[i * 3 + 0] = (Math.random() - 0.5) * r * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * r * 1.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * r * 2;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.02;
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial size={0.02} sizeAttenuation depthWrite={false} color="#fff1e6" transparent opacity={0.9} />
    </Points>
  );
}

function CreamVolumetricVeil() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(clock.getElapsedTime() * 0.6) * 0.05;
  });
  return (
    <mesh ref={ref} position={[0, 0, -1]}>
      <planeGeometry args={[10, 6]} />
      <meshBasicMaterial color="#f7e6d5" transparent opacity={0.26} />
    </mesh>
  );
}

function InnerScene() {
  const group = React.useRef<THREE.Group>(null);
  useFrame(({ mouse }) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, mouse.x * 0.15, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -mouse.y * 0.1, 0.05);
  });
  return (
    <group ref={group}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 2, 2]} intensity={0.6} />
      <CreamVolumetricVeil />
      <Particles count={2600} />
    </group>
  );
}

const HeroCanvas: React.FC = () => (
  <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 0, 3], fov: 45 }}>
    <InnerScene />
    <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
  </Canvas>
);

/* --------------------------------
 * Marquee
 * -------------------------------- */
const Marquee: React.FC<{ items: string[] }> = ({ items }) => {
  const track = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {track.map((t, i) => (
          <div className="marquee-item" key={i}><Star className="w-4 h-4 inline -mt-1 mr-1" /> {t}</div>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------
 * Team
 * -------------------------------- */
type TeamItem = { name: string; role: string; img: string; bio: string; highlights?: string[]; };
const teamData: TeamItem[] = [
  { name: "Ірина П.", role: "Подолог", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1600&auto=format&fit=crop",
    bio: "Складні випадки врослого нігтя, тріщини п'ят, профілактика ускладнень у пацієнтів з діабетом.",
    highlights: ["20+ сертифікацій", "М'які техніки", "Домашній догляд"] },
  { name: "Дар'я С.", role: "Подолог", img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1600&auto=format&fit=crop",
    bio: "Деформації нігтів/стоп, індивідуальні устілки, фокус на довготривалому результаті.",
    highlights: ["Ортоніксія", "Стерильність 4-го рівня", "Плани"] },
  { name: "Марина Л.", role: "Масажист", img: "https://images.unsplash.com/photo-1546539782-6fc531453083?q=80&w=1600&auto=format&fit=crop",
    bio: "Авторські техніки, лімфодренаж, фасції, делікатні протоколи для вагітних.",
    highlights: ["Лімфодренаж", "Blades", "Робота з болем"] },
  { name: "Аліна Дж.", role: "Лікар-косметолог", img: "https://images.unsplash.com/photo-1554647286-f365d7defc01?q=80&w=1600&auto=format&fit=crop",
    bio: "Естетична медицина без перебільшень. Ін'єкції, біорепарація, підтримка natural-look.",
    highlights: ["Індивідуальний підхід", "Natural-look", "Європротоколи"] },
];

const TeamSlider: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + teamData.length) % teamData.length);
  const next = () => setIdx((i) => (i + 1) % teamData.length);
  const active = teamData[idx];

  return (
    <div className="relative">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={active.img}
              src={active.img}
              alt={active.name}
              className="rounded-3xl border shadow-lg w-full h-[560px] object-cover img-skeleton"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.45, ease: EASE }}
              loading="lazy"
              onError={(e)=>{(e.currentTarget as HTMLImageElement).src="https://images.unsplash.com/photo-1546539782-6fc531453083?q=80&w=1600&auto=format&fit=crop"}}
            />
          </AnimatePresence>
        </div>

        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.name}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <h3 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>{active.name}</h3>
              <div className="mt-1 text-amber-900 font-semibold text-lg">{active.role}</div>
              <p className="mt-4 text-stone-700 leading-relaxed text-lg">{active.bio}</p>
              {active.highlights && (
                <ul className="mt-5 grid sm:grid-cols-2 gap-3">
                  {active.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-amber-900" />
                      <span className="text-stone-800">{h}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-7 flex items-center gap-3">
                <Pill variant="light" onClick={prev}><ChevronLeft className="w-4 h-4" /> <span>Попередній</span></Pill>
                <Pill variant="dark" onClick={next}><span>Наступний</span> <MoveRight className="w-4 h-4" /></Pill>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {teamData.map((t, i) => (
          <button
            key={t.name} aria-label={`Slide ${i + 1}`} onClick={() => setIdx(i)} type="button"
            className={`h-1.5 w-7 rounded-full transition-all ${i === idx ? "bg-amber-900" : "bg-stone-300"}`}
          />
        ))}
      </div>
    </div>
  );
};

/* --------------------------------
 * Ліва рейка + кисть
 * -------------------------------- */
const PinnedCreamRail: React.FC<{ topGap?: number; bottomGap?: number }> = ({ topGap = 64, bottomGap = 140 }) => {
  const height = Math.max(0, window.innerHeight - topGap - bottomGap);
  return (
    <motion.div
      className="fixed left-6 rounded-full bg-[color:var(--cream)] shadow-soft"
      style={{
        top: topGap,
        height,
        width: "6px",
        zIndex: 50,
      }}
    />
  );
};

const BrushOnRail: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>,
  topGap?: number; bottomGap?: number;
}> = ({ containerRef, topGap = 64, bottomGap = 140 }) => {
  const { scrollYProgress } = useScroll({ container: containerRef });
  const rawY = useMotionValue(0);
  const y = useSpring(rawY, { stiffness: 320, damping: 28, mass: 0.7 });
  const brushSize = 28;
  const [railH, setRailH] = useState<number>(() => Math.max(0, window.innerHeight - topGap - bottomGap));
  useEffect(() => {
    const onResize = () => setRailH(Math.max(0, window.innerHeight - topGap - bottomGap));
    onResize(); window.addEventListener("resize", onResize);
    return ()=>window.removeEventListener("resize", onResize);
  }, [topGap, bottomGap]);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (p) => {
      const maxY = Math.max(0, railH - brushSize);
      rawY.set(p * maxY);
    });
    return unsub;
  }, [scrollYProgress, railH, rawY]);

  const hideOnMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  if (hideOnMobile) return null;

  return (
    <div aria-hidden className="fixed left-3 md:left-6 z-40 pointer-events-none" style={{ top: topGap, height: railH, width: 24 }}>
      <motion.div style={{ y }} className="absolute left-1/2 -translate-x-1/2">
        <div className="rounded-full bg-[#f7e6d5] shadow-md border border-amber-200"
             style={{ width: brushSize, height: brushSize, display: "grid", placeItems: "center" }}>
          <Paintbrush className="w-4 h-4 text-amber-900" />
        </div>
      </motion.div>
    </div>
  );
};

/* --------------------------------
 * Головний компонент
 * -------------------------------- */
export default function ZhyvaStyleLanding() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);

  // Напрями — модалки
  const [dirOpen, setDirOpen] = useState(false);
  const [dirSel, setDirSel] = useState<Direction | null>(null);
  const openDirection = (d: Direction) => { setDirSel(d); setDirOpen(true); };
  const closeDirection = () => { setDirOpen(false); setTimeout(()=>setDirSel(null), 250); };

  const nav = useMemo(
    () => [
      { id: "about", label: "Про нас" },
      { id: "directions", label: "Напрями" },
      { id: "podology", label: "Подологія" },
      { id: "cosmetology", label: "Косметологія" },
      { id: "massage", label: "Масаж" },
      { id: "team", label: "Команда" },
      { id: "benefits", label: "Переваги" },
      { id: "contacts", label: "Контакти" }
    ],
    []
  );
  const sectionIds = nav.map(n => n.id);

  // Контейнер скролла
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: pageProgress } = useScroll({ container: containerRef });
  const dim = useTransform(pageProgress, [0, 1], [0, 0.12]);

  // Активна секція для точок
  const [, setActiveIdx] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sections.findIndex(sec => sec === e.target);
          if (idx >= 0) setActiveIdx(idx);
        }
      });
    }, { root: el, threshold: 0.5 });
    sections.forEach(s => io.observe(s));
    return ()=>io.disconnect();
  }, [sectionIds]);

  // Скью по швидкості
  const y = useMotionValue(0);
  const scrollV = useVelocity(pageProgress);
  const skew = useTransform(scrollV, [-1, 0, 1], [-3, 0, 3]);
  useAnimationFrame((_, delta) => { y.set(y.get() + delta); });

  // Хедер
  const headerRef = useRef<HTMLElement>(null);
  const [navShadow, setNavShadow] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setNavShadow(el.scrollTop > 8);
    el.addEventListener("scroll", onScroll);
    onScroll();

    const applyHeaderSize = () => {
      const h = headerRef.current?.offsetHeight ?? 64;
      document.documentElement.style.setProperty("--header-h", `${h}px`);
    };
    applyHeaderSize();
    const ro = new ResizeObserver(applyHeaderSize);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, []);

  // HERO overlay
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, container: containerRef, offset: ["start start", "end start"] });
  const overlay = useTransform(scrollYProgress, [0, 1], [0.26, 0.45]);
  const titleScaleY = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 10]);

  // reveal класи
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) (e.target as HTMLElement).classList.add("reveal-show"); }),
      { root, threshold: 0.12 }
    );
    const nodes = Array.from(root.querySelectorAll(".reveal"));
    nodes.forEach((n) => io.observe(n as Element));
    return () => io.disconnect();
  }, []);

  // FAB
  const fabRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!fabRef.current) return;
    const node = fabRef.current;
    popAnimate({
      from: 0, to: 1, duration: 500,
      onUpdate: (v) => {
        node.style.transform = `translateY(${(1 - v) * 10}px) scale(${0.9 + v * 0.1})`;
        node.style.opacity = String(v);
      },
      onComplete: () => {
        let time = performance.now();
        const loop = () => {
          const now = performance.now();
          const offset = Math.sin((now - time) / 550) * 2;
          node.style.transform = `translateY(${offset}px) scale(1)`;
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }
    });
  }, []);

  // CTA інерція
  const ctaRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    let hover = false;
    const onMove = (e: MouseEvent) => {
      if (!hover) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.animate([{ transform: `translate(${dx * 0.03}px, ${dy * 0.03}px)` }], { duration: 120, fill: "forwards" });
    };
    const enter = () => { hover = true; };
    const leave = () => {
      hover = false;
      popAnimate({
        from: 1,
        to: 0,
        ...inertia({ velocity: -300, power: 0.8, timeConstant: 350, bounceStiffness: 120, bounceDamping: 18 }),
        onUpdate: () => { el.style.transform = `translate(0,0)`; },
      });

    };
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => { window.removeEventListener("mousemove", onMove); el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-screen overflow-y-auto snap-y snap-mandatory bg-stone-50 text-stone-900 no-scrollbar snap-wrap"
    >
      {/* Ліва рейка + кисть */}
      <PinnedCreamRail topGap={64} bottomGap={140} />
      <BrushOnRail containerRef={containerRef} topGap={64} bottomGap={140} />

      {/* затемнение */}
      <motion.div className="pointer-events-none fixed inset-0 bg-black" style={{ opacity: dim }} />

      {/* HEADER */}
      <motion.header
        ref={headerRef}
        animate={{ boxShadow: navShadow ? "0 4px 20px rgba(0,0,0,0.08)" : "0 0 0 rgba(0,0,0,0)" }}
        className="sticky top-0 z-40 backdrop-blur bg-stone-50/80 border-b border-amber-100"
      >
        <Section className="py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: -6 }} className="w-8 h-8 rounded-xl bg-amber-900 text-amber-50 grid place-items-center font-bold">Z</motion.div>
            <div className="font-bold tracking-wide">ZHYVA</div>
          </div>

          <nav className="hidden md:flex items-center gap-5">
            {nav.map((n) => (
              <button key={n.id} onClick={() => scrollToId(n.id)} className="text-sm hover:text-amber-900 transition-colors">
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Pill variant="dark" onClick={() => scrollToId("contacts")}><span>Записатися</span></Pill>
            <button className="md:hidden p-2" aria-label="menu" onClick={() => setOpen((v) => !v)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </Section>

        {open && (
          <div className="md:hidden border-t border-amber-100">
            <Section className="py-2 grid grid-cols-2 gap-2">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setOpen(false); scrollToId(n.id); }}
                  className="text-left rounded-xl px-4 py-2 bg-white border hover:border-amber-200"
                >
                  {n.label}
                </button>
              ))}
            </Section>
          </div>
        )}
      </motion.header>

      {/* HERO */}
      <div className="relative snap diag-bg" ref={heroRef} style={{ height: "92vh" }}>
        <div className="absolute inset-0 z-0"><HeroCanvas /></div>
        <motion.div className="absolute inset-0 z-10" style={{ background: "linear-gradient(180deg, rgba(247,230,213,.18), rgba(12,10,9,.38))", opacity: overlay }} />
        <Section className="absolute inset-0 z-20 flex items-center">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="hero-copy max-w-2xl">
            <motion.h1 variants={fadeUp} className="hero-title" style={{ scaleY: titleScaleY, y: titleY }}>
              Центр подології, краси та здоров'я
            </motion.h1>
            <motion.p variants={fadeUp} className="hero-sub">
              Втечіть від рутини та присвятіть час собі. Ми поєднали експертність, сучасні технології та атмосферу спокою.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
              <Pill variant="dark" onClick={() => scrollToId("directions")}><Sparkles className="w-4 h-4" /> <span>Наші напрями</span></Pill>
              <Pill onClick={() => scrollToId("contacts")}><Heart className="w-4 h-4" /> <span>Записатися</span></Pill>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-6 inline-flex items-center gap-3 hero-chip">
              <Paintbrush className="w-5 h-5" /><span>Натхнення в деталях</span>
            </motion.div>
          </motion.div>
        </Section>
      </div>

      {/* Маркіза */}
      <Section className="py-8">
        <Marquee items={["Подологія", "Косметологія", "Масаж", "Natural look", "Стерильність", "Індивідуальний підхід", "Результат"]} />
      </Section>

      {/* ABOUT */}
      <motion.div style={{ skewY: skew }} className="skew-wrap">
        <Section id="about" className="py-section">
          <div className="absolute left-0 right-0 -z-10">
            <div className="mx-auto max-w-7xl h-64 rounded-3xl" style={{ backgroundColor: "rgba(247,230,213,.35)" }} />
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} style={{ fontFamily: "Playfair Display, serif" }}>Про нас</motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-stone-700 leading-relaxed">
                Ми віримо, що справжня краса починається зсередини — з гармонії між тілом, душею та розумом. Наші спеціалісти —
                подологи, косметологи та масажисти — працюють з турботою, аби кожен клієнт відчув, що про нього дбають.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{ n: "20+", l: "років досвіду" }, { n: "3", l: "напрями" }, { n: "1000+", l: "задоволених клієнтів" }].map((it) => (
                  <div key={it.l} className="rounded-2xl bg-white p-4 border text-center shadow-soft reveal">
                    <div className="text-3xl font-bold tracking-tight">{it.n}</div>
                    <div className="text-sm text-stone-600">{it.l}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                "https://www.megawecare.com/_next/image?url=https%3A%2F%2Fcdn.megawecare.com%2Fmega-we-care-global%2F1746009384142-Health_Benefits_Of_Thai_Massage_876X400.webp&w=1920&q=75",
                "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop"
              ].map((src, i) => (
                <div key={`g-${i}`} className="mask-reveal h-40 reveal">
                  <img src={src} alt="gallery" className="w-full h-full object-cover img-skeleton" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </Section>
      </motion.div>

      {/* НАПРЯМИ — карточки */}
      <Section id="directions" className="py-section">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "Playfair Display, serif" }}>Наші напрями</motion.h2>
          <motion.p variants={fadeUp} className="mt-2 text-stone-600">Турбота про себе — не розкіш, а красива звичка.</motion.p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {directions.map((d) => (
              <motion.div key={d.key} variants={fadeUp}>
                <DirectionCard
                  item={d}
                  onOpen={(x)=>{ openDirection(x); }}
                  viewportRoot={containerRef.current}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Подологія */}
      <Section id="podology" className="py-section">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} style={{ fontFamily: "Playfair Display, serif" }}>Подологія</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-stone-700">Делікатна подологія для краси та здоров'я стоп. Працюємо навіть зі складними випадками.</motion.p>
            <motion.ul variants={fadeUp} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
              {[
                "Видалення мозолів / натоптишів",
                "Догляд за тріщинами на п'ятах",
                "Корекція врослого нігтя",
                "Діагностика грибкових уражень",
                "Індивідуальні ортопедичні устілки",
                "Іонофорез від пітливості",
                "Видалення бородавок"
              ].map((t) => (
                <li key={t} className="bg-white border rounded-xl p-3 shadow-soft reveal">{t}</li>
              ))}
            </motion.ul>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {[
              "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1200&auto=format&fit=crop",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW1BFyxfk-iT99dT0n6gl71wrZECve-sVO4g&s",
              "https://vettaspa.com/wp-content/uploads/2024/11/vetta-nordic-spa-duo-massage.jpg",
              "https://images.unsplash.com/photo-1531829039722-d3fb3e705a4b?q=80&w=1200&auto=format&fit=crop"
            ].map((src, i) => (
              <div key={`p-${i}`} className="mask-reveal h-40 reveal">
                <img src={src} alt="podology" className="w-full h-full object-cover img-skeleton" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Косметологія */}
      <Section id="cosmetology" className="py-section">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
          Косметологія
        </motion.h2>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
          {[
            { t: "Корекція губ", d: "Belotero, Restylane Kiss, інше." },
            { t: "Бланшинг зморшок", d: "Belotero Soft / Balance." },
            { t: "Векторний ліфтинг", d: "Radiesse." },
            { t: "Об'ємне моделювання", d: "Belotero Intense / Volume." },
            { t: "Полінуклеотиди", d: "Rejuran, Vitarian." },
            { t: "Ботулінотерапія", d: "Xeomin, Botox, інше." },
            { t: "Біорепарація", d: "Yalupro Super Hydro і не тільки." },
            { t: "Чистки", d: "T-зона, обличчя + маска." },
            { t: "Пілінги", d: "PRX-T33, Retix, PCA." }
          ].map((item) => (
            <div key={item.t} className="rounded-2xl bg-white border p-5 shadow-soft reveal">
              <div className="font-semibold">{item.t}</div>
              <div className="text-sm text-stone-600 mt-1">{item.d}</div>
            </div>
          ))}
        </motion.div>
      </Section>

      {/* Масаж */}
      <Section id="massage" className="py-section">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>Масаж</h2>
            <p className="mt-3 text-stone-700">Масажі допомагають не лише розслабитися, а й відновити зв'язок із собою.</p>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
              {[
                "Масаж блейдами",
                "Екопластика тіла",
                "Авторський масаж обличчя",
                "Лімфодренаж",
                "Лікувальний масаж (dry needle)",
                "Масаж для вагітних"
              ].map((t) => (
                <li key={t} className="bg-white border rounded-xl p-3 shadow-soft reveal">{t}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=1200&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
              "https://lakshmispa.com.ua/wp-content/uploads/2021/05/Massazh-golovy-muzhchyne-v-Salone-tsena.jpg",
              "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop"
            ].map((src, i) => (
              <div key={`m-${i}`} className="mask-reveal h-40 reveal">
                <img src={src} alt="massage" className="rounded-2xl h-40 w-full object-cover img-skeleton" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Team */}
      <Section id="team" className="py-section">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ fontFamily: "Playfair Display, serif" }}>
          Наша команда
        </motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-2 text-stone-600">
          Професіонали, що піклуються про ваш комфорт і результат.
        </motion.p>
        <div className="mt-10 reveal">
          <TeamSlider />
        </div>
      </Section>

      {/* Benefits */}
      <Section id="benefits" className="py-section">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} style={{ fontFamily: "Playfair Display, serif" }}>Переваги нашого центру</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-stone-700">У нас можна повністю присвятити час собі — все в одному місці, уважно та професійно.</motion.p>
            <motion.div variants={fadeUp} className="mt-6 grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-5 border shadow-soft reveal">
                <ShieldCheck className="w-6 h-6" />
                <div className="font-semibold mt-2">Безпечно</div>
                <div className="text-sm text-stone-600">Медичні стандарти та стерильність.</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border shadow-soft reveal">
                <Users className="w-6 h-6" />
                <div className="font-semibold mt-2">Команда</div>
                <div className="text-sm text-stone-600">Досвідчені спеціалісти.</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border shadow-soft reveal">
                <Sparkles className="w-6 h-6" />
                <div className="font-semibold mt-2">Результат</div>
                <div className="text-sm text-stone-600">Делікатно та ефективно.</div>
              </div>
            </motion.div>
          </motion.div>
          <img
            src="https://yukienatori-newyork.com/wp-content/uploads/2023/02/1.jpg"
            alt="benefits"
            className="rounded-3xl shadow-lg border reveal img-skeleton"
            loading="lazy"
          />
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-section">
        <div className="rounded-3xl text-amber-900 p-0 overflow-hidden reveal">
          <div className="bg-[color:var(--cream)] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>Дізнатись ціни</h3>
              <p className="mt-2 text-stone-700">Надішліть контакт — адміністратор надішле актуальний прайс.</p>
            </div>
            <a ref={ctaRef} href="#contacts" className="btn btn-dark rounded-full px-6 py-3 inline-flex items-center gap-2">
              Перейти до контактів <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Section>

      {/* Contacts */}
      <Section id="contacts" className="py-section">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>Контакти</h2>
            <p className="mt-2 text-stone-700">Залиште заявку — ми зв'яжемось у зручний час.</p>
            <form className="mt-6 grid grid-cols-1 gap-3 reveal" onSubmit={(e)=>e.preventDefault()}>
              <input className="rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300 transition" placeholder="Ім'я" />
              <input className="rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300 transition" placeholder="Телефон" />
              <textarea className="rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300 transition" placeholder="Повідомлення" rows={4} />
              <button type="button" className="btn btn-primary" onClick={()=>setModal(true)}>Надіслати</button>
              <p className="text-xs text-stone-500">* Форма демонстраційна. Підключіть свій бекенд або сервіс форм.</p>
            </form>
          </div>
          <div className="rounded-2xl overflow-hidden border bg-white reveal">
            <iframe
              title="map" className="w-full h-[360px]" loading="lazy"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2625.337923!2d30.5234!3d50.4501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z0JrQuNC10LLRgdC60LjQutC-0LPQviDQlNGW0L3RltC90L7QtNC40YDQvtCy0LA!5e0!3m2!1suk!2sua!4v1700000000000"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-5">
              <div className="font-semibold">м. Київ</div>
              <div className="text-sm text-stone-600">Пн–Нд 09:00–20:00</div>
              <a href="tel:+380000000000" className="block mt-2">+380 00 000 00 00</a>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-200">
        <Section className="py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-700 text-amber-50 grid place-items-center font-bold">Z</div>
            <div className="font-semibold">ZHYVA</div>
          </div>
          <div className="text-sm">© {new Date().getFullYear()} Zhyva. Всі права захищено.</div>
          <div className="text-sm">Розроблено на React + Three + Motion</div>
        </Section>
      </footer>

      {/* FAB */}
      <button ref={fabRef} className="fab" aria-label="Передзвоніть мені" onClick={()=>setModal(true)}>
        <Phone className="w-5 h-5" />
      </button>

      {/* Modal (форма) */}
      <AnimatePresence>
        {modal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e)=>{ if (e.currentTarget === e.target) setModal(false); }}>
            <motion.div className="modal"
              initial={{ y: 24, opacity: .6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
            >
              <div className="modal-header">
                <h3 className="text-xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>Залиште номер — ми передзвонимо</h3>
                <button className="modal-close" onClick={()=>setModal(false)} aria-label="Закрити"><X className="w-5 h-5" /></button>
              </div>
              <div className="modal-body">
                <form className="grid gap-3" onSubmit={(e)=>e.preventDefault()}>
                  <input className="rounded-xl border px-4 py-3" placeholder="Ім'я" />
                  <input className="rounded-xl border px-4 py-3" placeholder="Телефон" />
                  <textarea className="rounded-xl border px-4 py-3" placeholder="Коментар (необов'язково)" rows={3} />
                  <div className="flex gap-3">
                    <button className="btn btn-primary" type="button" onClick={()=>setModal(false)}>Надіслати</button>
                    <button className="btn" type="button" onClick={()=>setModal(false)}>Скасувати</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direction Modal */}
      <DirectionModal
        open={dirOpen}
        direction={dirSel}
        onClose={closeDirection}
        onBook={() => { closeDirection(); scrollToId("contacts"); }}
      />
    </div>
  );
}
