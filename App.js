// App.js
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function App() {
  const [output, setOutput] = useState([
    'Bem-vindo à Aventura em Texto!',
    'Você está em uma floresta densa. Há caminhos para o norte, leste, sul e oeste.',
  ]);
  const [input, setInput] = useState('');
  const [localizacao, setLocalizacao] = useState('floresta');
  const [inventario, setInventario] = useState([]);
  const [vida, setVida] = useState(100);
  const [jogoAtivo, setJogoAtivo] = useState(true);
  const [puzzlesResolvidos, setPuzzlesResolvidos] = useState({});
  const [inimigosDerrotados, setInimigosDerrotados] = useState({});
  const [emCombate, setEmCombate] = useState(null);
  const [chaveEncontrada, setChaveEncontrada] = useState(false);
  const [bauAberto, setBauAberto] = useState(false);

  const locais = {
    floresta: {
      descricao: 'Você está em uma floresta densa. Há caminhos para o norte, leste, sul e oeste.',
      caminhos: { norte: 'cabana', leste: 'rio', sul: 'caverna', oeste: null },
      inimigo: null,
      itens: ['madeira', 'corda'],
    },
    cabana: {
      descricao: 'Você encontra uma cabana abandonada.',
      caminhos: { sul: 'floresta' },
      inimigo: null,
      itens: [],
      puzzle: {
        descricao: 'A cabana está velha e empoeirada. Talvez haja algo útil aqui.',
      },
    },
    rio: {
      descricao: 'Você chega a um rio com uma ponte quebrada.',
      caminhos: { oeste: 'floresta' },
      inimigo: null,
      itens: [],
    },
    caverna: {
      descricao: 'Você entra em uma caverna escura.',
      caminhos: { norte: 'floresta' },
      inimigo: {
        nome: 'Goblin',
        vida: 50,
        ataque: 10,
      },
      itens: [],
    },
    tesouro: {
      descricao: 'Você encontrou o tesouro perdido! Parabéns!',
      caminhos: {},
      inimigo: null,
      itens: [],
    },
  };

  const comandosEspeciais = ['inventário', 'status', 'ajuda'];

  const processarComando = (comando) => {
    let newOutput = [...output];
    comando = comando.toLowerCase();

    if (emCombate) {
      processarCombate(comando, newOutput);
    } else if (comandosEspeciais.includes(comando)) {
      executarComandoEspecial(comando, newOutput);
    } else if (['norte', 'sul', 'leste', 'oeste'].includes(comando)) {
      moverPara(comando, newOutput);
    } else if (comando.startsWith('usar ')) {
      usarItem(comando.substring(5), newOutput);
    } else if (comando.startsWith('examinar ')) {
      examinar(comando.substring(9), newOutput);
    } else if (comando === 'abrir baú') {
      abrirBau(newOutput);
    } else if (comando === 'consertar ponte') {
      consertarPonte(newOutput);
    } else if (comando === 'sair') {
      newOutput.push('Obrigado por jogar!');
      setJogoAtivo(false);
    } else {
      newOutput.push('Comando inválido. Digite "ajuda" para ver os comandos disponíveis.');
    }

    setOutput(newOutput);
  };

  const executarComandoEspecial = (comando, newOutput) => {
    if (comando === 'inventário') {
      newOutput.push(`Seu inventário: ${inventario.join(', ') || 'vazio'}.`);
    } else if (comando === 'status') {
      newOutput.push(`Sua vida: ${vida}`);
    } else if (comando === 'ajuda') {
      newOutput.push(
        'Comandos disponíveis: norte, sul, leste, oeste, usar [item], examinar [objeto], abrir baú, consertar ponte, inventário, status, sair'
      );
    }
  };

  const moverPara = (direcao, newOutput) => {
    const localAtual = locais[localizacao];
    const novaLocalizacao = localAtual.caminhos[direcao] || null;

    if (novaLocalizacao) {
      setLocalizacao(novaLocalizacao);
      newOutput.push(locais[novaLocalizacao].descricao);
      explorarLocalizacao(novaLocalizacao, newOutput);
    } else {
      newOutput.push('Você não pode ir para essa direção daqui.');
    }
  };

  const explorarLocalizacao = (loc, newOutput) => {
    const localAtual = locais[loc];

    // Inimigo
    if (localAtual.inimigo && !inimigosDerrotados[loc]) {
      iniciarCombate(localAtual.inimigo, loc, newOutput);
      return; // Não prossegue para coletar itens se houver combate
    }

    // Descrição adicional
    if (localAtual.puzzle && !puzzlesResolvidos[loc]) {
      newOutput.push(localAtual.puzzle.descricao);
    }

    // Itens
    if (localAtual.itens.length > 0) {
      localAtual.itens.forEach((item) => {
        if (!inventario.includes(item)) {
          newOutput.push(`Você encontrou um(a) ${item}.`);
          setInventario((prevInventario) => [...prevInventario, item]);
        }
      });
      // Limpa os itens do local após coletados
      locais[loc].itens = [];
    }
  };

  const iniciarCombate = (inimigo, loc, newOutput) => {
    newOutput.push(`Um ${inimigo.nome} aparece!`);
    setEmCombate({ ...inimigo, local: loc, vidaAtual: inimigo.vida });
  };

  const processarCombate = (comando, newOutput) => {
    if (comando === 'atacar') {
      let danoCausado = inventario.includes('espada') ? 20 : 10;
      let vidaInimigo = emCombate.vidaAtual - danoCausado;

      newOutput.push(
        `Você ataca o ${emCombate.nome}${
          inventario.includes('espada') ? ' com sua espada' : ''
        }. Vida do ${emCombate.nome}: ${vidaInimigo}`
      );

      if (vidaInimigo <= 0) {
        newOutput.push(`Você derrotou o ${emCombate.nome}!`);
        setInimigosDerrotados((prev) => ({ ...prev, [emCombate.local]: true }));

        // Entrega do martelo após derrotar o Goblin
        if (emCombate.nome === 'Goblin' && !inventario.includes('martelo')) {
          newOutput.push(`O ${emCombate.nome} deixou cair um martelo.`);
          setInventario((prevInventario) => [...prevInventario, 'martelo']);
        }

        setEmCombate(null);

        // Após o combate, explorar a localização para coletar itens
        explorarLocalizacao(emCombate.local, newOutput);
      } else {
        // Turno do inimigo
        let danoRecebido = emCombate.ataque - (inventario.includes('escudo') ? 5 : 0);
        let vidaJogador = vida - danoRecebido;

        newOutput.push(`O ${emCombate.nome} te ataca! Sua vida: ${vidaJogador}`);

        if (vidaJogador <= 0) {
          newOutput.push('Você foi derrotado!');
          setVida(0);
          setJogoAtivo(false);
          setEmCombate(null);
        } else {
          setVida(vidaJogador);
          setEmCombate((prev) => ({ ...prev, vidaAtual: vidaInimigo }));
        }
      }
    } else {
      newOutput.push('Comando inválido durante o combate. Use "atacar".');
    }
  };

  const usarItem = (item, newOutput) => {
    if (inventario.includes(item)) {
      if (item === 'poção') {
        setVida((prevVida) => prevVida + 30);
        newOutput.push('Você usou uma poção e recuperou 30 pontos de vida.');
        setInventario((prevInventario) => prevInventario.filter((i) => i !== 'poção'));
      } else {
        newOutput.push(`Você equipou o(a) ${item}.`);
      }
    } else {
      newOutput.push('Você não possui esse item.');
    }
  };

  const examinar = (objeto, newOutput) => {
    if (localizacao === 'cabana') {
      if (objeto === 'cabana' || objeto === 'móveis' || objeto === 'estante') {
        if (!chaveEncontrada) {
          newOutput.push('Você encontra uma chave escondida atrás de uma estante!');
          setChaveEncontrada(true);
          setInventario((prevInventario) => [...prevInventario, 'chave']);
        } else {
          newOutput.push('Você já encontrou a chave aqui.');
        }
      } else {
        newOutput.push('Não há nada de interessante nisso.');
      }
    } else {
      newOutput.push('Nada de interessante aqui.');
    }
  };

  const abrirBau = (newOutput) => {
    if (localizacao !== 'cabana') {
      newOutput.push('Você não está no local certo para fazer isso.');
      return;
    }

    if (!chaveEncontrada || !inventario.includes('chave')) {
      newOutput.push('Você precisa de uma chave para abrir o baú.');
      return;
    }

    if (bauAberto) {
      newOutput.push('O baú já está aberto.');
      return;
    }

    newOutput.push('Você usou a chave para abrir o baú e encontrou uma espada!');
    setInventario((prevInventario) => [...prevInventario, 'espada']);
    setBauAberto(true);
    setPuzzlesResolvidos((prev) => ({ ...prev, cabana: true }));
  };

  const consertarPonte = (newOutput) => {
    if (localizacao !== 'rio') {
      newOutput.push('Você não está no local certo para fazer isso.');
      return;
    }

    if (puzzlesResolvidos['rio']) {
      newOutput.push('A ponte já está consertada.');
      return;
    }

    if (inventario.includes('madeira') && inventario.includes('corda') && inventario.includes('martelo')) {
      newOutput.push('Você usou a madeira, a corda e o martelo para consertar a ponte.');
      setPuzzlesResolvidos((prev) => ({ ...prev, rio: true }));
      newOutput.push('Agora você pode atravessar a ponte para o outro lado.');
      // Atualiza o caminho dinamicamente
      setLocalizacao((prevLoc) => {
        locais['rio'].caminhos['leste'] = 'tesouro';
        return prevLoc;
      });
    } else {
      newOutput.push('Você precisa de madeira, corda e martelo para consertar a ponte.');
    }
  };

  const handleInput = () => {
    if (input.trim() !== '') {
      processarComando(input.trim().toLowerCase());
      setInput('');
    }
  };

  const scrollViewRef = useRef();

  const reiniciarJogo = () => {
    setOutput([
      'Bem-vindo à Aventura em Texto!',
      'Você está em uma floresta densa. Há caminhos para o norte, leste, sul e oeste.',
    ]);
    setInput('');
    setLocalizacao('floresta');
    setInventario([]);
    setVida(100);
    setJogoAtivo(true);
    setPuzzlesResolvidos({});
    setInimigosDerrotados({});
    setEmCombate(null);
    setChaveEncontrada(false);
    setBauAberto(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.outputContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {output.map((line, index) => (
          <Text key={index} style={styles.text}>
            {line}
          </Text>
        ))}
      </ScrollView>
      {jogoAtivo ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={
                emCombate
                  ? 'Digite "atacar" para atacar o inimigo.'
                  : 'Digite seu comando...'
              }
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleInput}
            />
            <TouchableOpacity style={styles.button} onPress={handleInput}>
              <Text style={styles.buttonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <TouchableOpacity style={styles.restartButton} onPress={reiniciarJogo}>
          <Text style={styles.buttonText}>Reiniciar Jogo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#222',
  },
  outputContainer: {
    flex: 1,
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    color: '#fff',
    marginRight: 10,
    backgroundColor: '#333',
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  restartButton: {
    backgroundColor: '#32cd32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
  },
});
