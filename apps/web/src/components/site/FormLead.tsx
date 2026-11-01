"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Campo } from "@/components/ui/Campo";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Icone } from "@/components/ui/Icone";

function lerUtm(): Record<string, string> {
  const u = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = u.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  return utm;
}

/** Contato antes do lançamento nas lojas (POST /api/v1/leads). */
export function FormLead({ origem = "landing" }: { origem?: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pronto, setPronto] = useState(false);
  const { enviando, erro, campos, enviar, validar } = useEnvio();

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    const digitos = whatsapp.replace(/\D/g, "");
    const temErro = validar({
      email: !/^\S+@\S+\.\S+$/.test(email.trim()) && "Informe um e-mail válido",
      whatsapp: digitos && (digitos.length < 10 || digitos.length > 13) && "WhatsApp com DDD, só números",
    });
    if (temErro) return;
    const r = await enviar(() =>
      api("/api/v1/leads", {
        corpo: {
          nome: nome.trim() || undefined,
          email: email.trim(),
          whatsapp: digitos || undefined,
          origem,
          utm: lerUtm(),
        },
      }),
    );
    if (r) setPronto(true);
  }

  if (pronto) {
    return (
      <div className="rounded-[28px] bg-branco p-6 text-tinta shadow-[0_30px_60px_-30px_rgb(15_21_48/0.4)] sm:p-8" role="status">
        <span className="grid size-14 place-items-center rounded-full bg-verde-t text-[#0A6633]">
          <Icone nome="check" tamanho={28} strokeWidth={3} />
        </span>
        <p className="mt-4 font-display text-[40px] leading-none font-extrabold uppercase">Pronto{nome.trim() ? `, ${nome.trim().split(" ")[0]}` : ""}.</p>
        <p className="mt-3 text-lg text-tx2">Você recebe o link do app no lançamento. Enquanto isso, dá para criar sua conta e começar o teste pelo site.</p>
        <BotaoLink href="/cadastro" className="mt-6" iconeDepois="setaDireita">
          Criar minha conta
        </BotaoLink>
      </div>
    );
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="grid gap-4 rounded-[28px] bg-branco p-6 text-tinta shadow-[0_30px_60px_-30px_rgb(15_21_48/0.4)] sm:p-8"
      aria-describedby="lead-nota"
    >
      <p className="text-xl font-extrabold">Receba o link do app no lançamento</p>
      <Campo rotulo="Nome" opcional autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
      <Campo
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        erro={campos.email}
      />
      <Campo
        rotulo="WhatsApp"
        opcional
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="(11) 90000-0000"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        erro={campos.whatsapp}
      />
      {erro && !Object.keys(campos).length ? <Aviso tom="erro">{erro}</Aviso> : null}
      <Botao type="submit" tamanho="lg" carregando={enviando} larguraTotal>
        {enviando ? "Enviando..." : "Quero o link do app"}
      </Botao>
      <p id="lead-nota" className="text-[13px] leading-relaxed text-tx2">
        Usamos seu contato só para avisar do lançamento. Sem spam, e você pode pedir para sair quando quiser. Veja a{" "}
        <Link href="/privacidade" className="font-semibold text-azul">
          política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}
