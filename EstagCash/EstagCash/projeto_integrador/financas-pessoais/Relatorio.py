"""
relatorio.py — Gerador de relatório financeiro
================================================
Uso (qualquer um dos dois funciona):
    python relatorio.py
    python relatorio.py dados.json

Descrição:
    Lê o arquivo JSON exportado pelo site (tela "Exportar Extrato"),
    agrupa os lançamentos por mês e imprime um resumo detalhado no terminal.

    Você NÃO precisa mover o arquivo: o script procura sozinho o JSON mais
    recente na pasta do projeto e na pasta Downloads do computador.
    Se não achar nenhum, usa o arquivo de exemplo dados_exemplo.json
    (que acompanha o projeto) para demonstrar o relatório.

    Não exige nenhuma biblioteca externa — usa só o que vem com o Python.

Requisitos:
    Python 3.7 ou superior.
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# Garante que acentos e barras apareçam certo no terminal do Windows
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

NOME_EXEMPLO = "dados_exemplo.json"


# ─── Utilitários ──────────────────────────────────────────────────────────────

def formatar_moeda(valor: float) -> str:
    """Formata um número como R$ 1.234,56."""
    texto = f"{abs(valor):,.2f}"  # 1,234.56
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
    sinal = "-" if valor < 0 else ""
    return f"{sinal}R$ {texto}"


def mes_por_extenso(ano_mes: str) -> str:
    """Converte 'AAAA-MM' em 'Janeiro de 2025'."""
    meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ]
    ano, mes = ano_mes.split("-")
    return f"{meses[int(mes) - 1]} de {ano}"


def extrair_mes(data_iso: str) -> str:
    """Extrai 'AAAA-MM' de uma string 'AAAA-MM-DD'."""
    return data_iso[:7]


# ─── Localização do arquivo ───────────────────────────────────────────────────

def pasta_do_script() -> Path:
    return Path(__file__).resolve().parent


def pastas_downloads() -> list:
    """Lista as pastas onde o navegador costuma salvar (Windows/Mac/Linux)."""
    home = Path.home()
    pastas = []

    # Windows: lê o local real da pasta Downloads (pode estar no OneDrive)
    if sys.platform == "win32":
        try:
            import winreg
            chave = r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, chave) as k:
                valor, _ = winreg.QueryValueEx(k, "{374DE290-123F-4565-9164-39C4925E467B}")
                pastas.append(Path(os.path.expandvars(valor)))
        except Exception:
            pass

    pastas.append(home / "Downloads")
    pastas.extend(sorted(home.glob("OneDrive*/Downloads")))
    pastas.extend(sorted(home.glob("OneDrive*/Transferências")))

    unicas = []
    for p in pastas:
        if p.is_dir() and p not in unicas:
            unicas.append(p)
    return unicas


def pastas_de_busca() -> list:
    """Pasta atual, pasta do script e Downloads — nessa ordem, sem repetir."""
    candidatas = [Path.cwd(), pasta_do_script()] + pastas_downloads()
    unicas = []
    for p in candidatas:
        if p not in unicas:
            unicas.append(p)
    return unicas


def ler_json(caminho: Path):
    """Lê o arquivo; devolve o dict se for um export válido do site, senão None."""
    try:
        with open(caminho, encoding="utf-8-sig") as f:
            dados = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None
    if isinstance(dados, dict) and "lancamentos" in dados:
        return dados
    return None


def achar_arquivo_automatico():
    """
    Procura o export mais recente (dados.json, dados (1).json, dados-2.json...)
    nas pastas de busca. Devolve (caminho, dados) ou (None, None).
    """
    achados = []
    for pasta in pastas_de_busca():
        for arq in pasta.glob("dados*.json"):
            if arq.name.lower() == NOME_EXEMPLO:
                continue
            try:
                achados.append((arq.stat().st_mtime, arq))
            except OSError:
                pass

    for _, arq in sorted(achados, key=lambda x: x[0], reverse=True):
        dados = ler_json(arq)
        if dados is not None:
            return arq, dados
    return None, None


def achar_arquivo_informado(nome: str):
    """O usuário digitou um nome: tenta o caminho direto e depois as pastas de busca."""
    direto = Path(nome)
    if direto.is_file():
        return direto
    for pasta in pastas_de_busca():
        if (pasta / nome).is_file():
            return pasta / nome
    return None


# ─── Carregamento ─────────────────────────────────────────────────────────────

def carregar_dados(argumento):
    """
    Devolve (caminho, dados). Ordem:
      1. arquivo informado no comando (procurado em várias pastas)
      2. export mais recente encontrado automaticamente
      3. dados_exemplo.json do projeto (só para demonstração)
    """
    if argumento:
        caminho = achar_arquivo_informado(argumento)
        if caminho is None:
            print(f"\n❌  Não encontrei o arquivo: {argumento}")
            print("   Procurei na pasta atual, na pasta do projeto e em Downloads.")
            print("   Exporte pelo site (botão 'Exportar JSON') ou rode só: python relatorio.py")
            sys.exit(1)
        try:
            with open(caminho, encoding="utf-8-sig") as f:
                dados = json.load(f)
        except json.JSONDecodeError as e:
            print(f"\n❌  O arquivo não é um JSON válido: {e}")
            sys.exit(1)
        if "lancamentos" not in dados:
            print("\n❌  Formato inválido: a chave 'lancamentos' não foi encontrada.")
            print("   Use o botão 'Exportar JSON' na tela Exportar Extrato do site.")
            sys.exit(1)
        return caminho, dados

    caminho, dados = achar_arquivo_automatico()
    if dados is not None:
        return caminho, dados

    exemplo = pasta_do_script() / NOME_EXEMPLO
    dados = ler_json(exemplo) if exemplo.is_file() else None
    if dados is not None:
        print("\nℹ️   Nenhum arquivo exportado foi encontrado (nem na pasta do projeto, nem em Downloads).")
        print("    Mostrando o arquivo de EXEMPLO. Para ver os seus dados, clique em")
        print("    'Exportar JSON' no site e rode o comando de novo.")
        return exemplo, dados

    print("\n❌  Nenhum arquivo de dados encontrado.")
    print("   Clique em 'Exportar JSON' no site e rode: python relatorio.py")
    sys.exit(1)


# ─── Processamento ────────────────────────────────────────────────────────────

def agrupar_por_mes(lancamentos: list) -> dict:
    """Agrupa lançamentos por mês ('AAAA-MM')."""
    grupos = defaultdict(list)
    for l in lancamentos:
        data = l.get("data", "")
        if len(data) >= 7:
            grupos[extrair_mes(data)].append(l)
    return dict(sorted(grupos.items()))


def calcular_resumo_mes(lancamentos: list) -> dict:
    """Calcula entradas, saídas, saldo e gasto por categoria para um mês."""
    entradas = 0.0
    saidas = 0.0
    por_categoria = defaultdict(float)

    for l in lancamentos:
        valor = float(l.get("valor", 0))
        tipo = l.get("tipo", "").strip().lower()

        if tipo == "entrada":
            entradas += valor
        else:
            saidas += valor
            categoria = l.get("categoria", "Sem categoria") or "Sem categoria"
            por_categoria[categoria] += valor

    return {
        "entradas": entradas,
        "saidas": saidas,
        "saldo": entradas - saidas,
        "por_categoria": dict(
            sorted(por_categoria.items(), key=lambda x: x[1], reverse=True)
        ),
    }


# ─── Exibição ─────────────────────────────────────────────────────────────────

LINHA = "─" * 52


def imprimir_cabecalho(dados: dict, caminho: Path):
    print()
    print("=" * 52)
    print("   RELATÓRIO FINANCEIRO — ESTAGCASH")
    print("=" * 52)
    print(f"   Arquivo: {caminho.name}")

    exportado_em = dados.get("exportadoEm", "")
    if exportado_em:
        try:
            dt = datetime.fromisoformat(exportado_em.replace("Z", "+00:00"))
            exportado_fmt = dt.astimezone().strftime("%d/%m/%Y às %H:%M")
        except ValueError:
            exportado_fmt = exportado_em
        print(f"   Exportado em: {exportado_fmt}")

    filtros = dados.get("filtros", {})
    if filtros:
        inicio = filtros.get("dataInicio", "")
        fim = filtros.get("dataFim", "")
        cat = filtros.get("categoria", "Todas")
        if inicio and fim:
            def fmt(d):
                p = d.split("-")
                return f"{p[2]}/{p[1]}/{p[0]}" if len(p) == 3 else d
            print(f"   Período: {fmt(inicio)} a {fmt(fim)}")
        if cat and cat != "Todas":
            print(f"   Categoria: {cat}")

    total = dados.get("totalLancamentos", len(dados.get("lancamentos", [])))
    print(f"   Total de lançamentos: {total}")
    print("=" * 52)


def imprimir_mes(mes: str, lancamentos: list):
    resumo = calcular_resumo_mes(lancamentos)

    print()
    print(LINHA)
    print(f"  {mes_por_extenso(mes).upper()}")
    print(LINHA)

    print(f"  {'Entradas:':<28} {formatar_moeda(resumo['entradas']):>20}")
    print(f"  {'Saídas:':<28} {formatar_moeda(-resumo['saidas']):>20}")
    print(f"  {'Saldo do mês:':<28} {formatar_moeda(resumo['saldo']):>20}")

    if resumo["por_categoria"]:
        print()
        print("  Gastos por categoria:")
        maior = max(resumo["por_categoria"].values())
        for cat, total_cat in resumo["por_categoria"].items():
            proporcao = int((total_cat / maior) * 12) if maior > 0 else 0
            barra = "█" * proporcao + "░" * (12 - proporcao)
            print(f"    {cat:<22} {barra}  {formatar_moeda(total_cat):>12}")

    print()
    print("  Lançamentos:")
    for l in sorted(lancamentos, key=lambda x: x.get("data", ""), reverse=True):
        data = l.get("data", "")
        data_fmt = f"{data[8:10]}/{data[5:7]}" if len(data) == 10 else data
        nome = l.get("nome") or l.get("descricao") or "—"
        tipo = l.get("tipo", "").strip().lower()
        valor = float(l.get("valor", 0))
        sinal = "+" if tipo == "entrada" else "-"
        print(f"    {data_fmt}  {nome:<26}  {sinal}{formatar_moeda(valor):>12}")


def imprimir_totais_gerais(grupos: dict):
    total_entradas = 0.0
    total_saidas = 0.0
    por_categoria_geral = defaultdict(float)

    for lancamentos in grupos.values():
        resumo = calcular_resumo_mes(lancamentos)
        total_entradas += resumo["entradas"]
        total_saidas += resumo["saidas"]
        for cat, val in resumo["por_categoria"].items():
            por_categoria_geral[cat] += val

    print()
    print("=" * 52)
    print("  RESUMO GERAL DO PERÍODO")
    print("=" * 52)
    print(f"  {'Total de entradas:':<28} {formatar_moeda(total_entradas):>20}")
    print(f"  {'Total de saídas:':<28} {formatar_moeda(-total_saidas):>20}")
    print(f"  {'Saldo geral:':<28} {formatar_moeda(total_entradas - total_saidas):>20}")

    if por_categoria_geral:
        print()
        print("  Maiores gastos (período completo):")
        ordenados = sorted(por_categoria_geral.items(), key=lambda x: x[1], reverse=True)
        for cat, val in ordenados[:5]:
            print(f"    {cat:<30} {formatar_moeda(val):>18}")

    print()
    print("=" * 52)
    print()


# ─── Ponto de entrada ─────────────────────────────────────────────────────────

def main():
    argumento = sys.argv[1] if len(sys.argv) > 1 else None
    caminho, dados = carregar_dados(argumento)
    lancamentos = dados.get("lancamentos", [])

    if not lancamentos:
        print("\nNenhum lançamento encontrado no arquivo. Verifique o período exportado.")
        sys.exit(0)

    grupos = agrupar_por_mes(lancamentos)

    imprimir_cabecalho(dados, caminho)
    for mes, lans in grupos.items():
        imprimir_mes(mes, lans)
    imprimir_totais_gerais(grupos)


if __name__ == "__main__":
    main()