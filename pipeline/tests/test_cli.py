from pipeline.cli import main

Diario = list[tuple[str, str]]


def rodar(argv, fontes):
    """Executa o CLI e devolve o código de saída, inclusive quando o argparse encerra."""
    try:
        return main(argv, fontes=fontes)
    except SystemExit as saida:
        return saida.code


class FonteFalsa:
    """Fonte que registra as etapas executadas, e pode falhar numa delas."""

    def __init__(self, nome, diario, falha_em=None):
        self.nome = nome
        self._diario = diario
        self._falha_em = falha_em

    def _executar(self, etapa):
        self._diario.append((self.nome, etapa))
        if etapa == self._falha_em:
            raise RuntimeError(f"{self.nome} falhou em {etapa}")

    def baixar(self):
        self._executar("baixar")

    def limpar(self):
        self._executar("limpar")

    def calcular(self):
        self._executar("calcular")

    def validar(self):
        self._executar("validar")

    def exportar(self):
        self._executar("exportar")


def test_run_executa_as_cinco_etapas_em_ordem():
    diario: Diario = []
    codigo = rodar(["run"], fontes=[FonteFalsa("malha", diario)])

    assert codigo == 0
    assert diario == [
        ("malha", "baixar"),
        ("malha", "limpar"),
        ("malha", "calcular"),
        ("malha", "validar"),
        ("malha", "exportar"),
    ]


def test_run_com_fonte_executa_so_aquela_fonte():
    diario: Diario = []
    fontes = [FonteFalsa("malha", diario), FonteFalsa("sim", diario)]

    codigo = rodar(["run", "--fonte", "sim"], fontes=fontes)

    assert codigo == 0
    assert [nome for nome, _ in diario] == ["sim"] * 5


def test_run_com_etapa_executa_so_aquela_etapa_em_cada_fonte():
    diario: Diario = []
    fontes = [FonteFalsa("malha", diario), FonteFalsa("sim", diario)]

    codigo = rodar(["run", "--etapa", "limpar"], fontes=fontes)

    assert codigo == 0
    assert diario == [("malha", "limpar"), ("sim", "limpar")]


def test_fonte_desconhecida_e_erro_e_nada_executa(capsys):
    diario: Diario = []

    codigo = rodar(["run", "--fonte", "inexistente"], fontes=[FonteFalsa("malha", diario)])

    assert codigo != 0
    assert diario == []
    assert "inexistente" in capsys.readouterr().err


def test_etapa_desconhecida_e_erro_e_nada_executa():
    diario: Diario = []

    codigo = rodar(["run", "--etapa", "publicar"], fontes=[FonteFalsa("malha", diario)])

    assert codigo != 0
    assert diario == []


def test_falha_na_validacao_impede_exportar_aquela_fonte_e_as_outras_seguem(capsys):
    diario: Diario = []
    fontes = [
        FonteFalsa("malha", diario, falha_em="validar"),
        FonteFalsa("sim", diario),
    ]

    codigo = rodar(["run"], fontes=fontes)

    assert codigo != 0
    assert ("malha", "validar") in diario
    assert ("malha", "exportar") not in diario
    assert ("sim", "exportar") in diario
    assert "malha falhou em validar" in capsys.readouterr().err


def test_listar_mostra_etapas_e_fontes_sem_executar(capsys):
    diario: Diario = []
    fontes = [FonteFalsa("malha", diario), FonteFalsa("sim", diario)]

    codigo = rodar(["run", "--listar"], fontes=fontes)

    saida = capsys.readouterr().out
    assert codigo == 0
    assert diario == []
    assert "baixar → limpar → calcular → validar → exportar" in saida
    assert "malha" in saida and "sim" in saida
