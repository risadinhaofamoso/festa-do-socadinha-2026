import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRIMEIROS_NOMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Fernanda", "Lucas", "Juliana",
  "Marcos", "Patrícia", "Rafael", "Camila", "Bruno", "Larissa", "Felipe",
  "Beatriz", "Gustavo", "Aline", "Rodrigo", "Priscila",
];

const SOBRENOMES = [
  "Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Rodrigues",
  "Almeida", "Nascimento", "Lima", "Araújo", "Ribeiro", "Carvalho", "Gomes",
  "Martins", "Rocha", "Barbosa", "Freitas", "Cardoso", "Teixeira",
];

const FORMAS_PAGAMENTO = ["Dinheiro", "Pix", "Cartão de crédito", "Cartão de débito", "Transferência"];

function nomeAleatorio(rand: () => number) {
  const primeiro = PRIMEIROS_NOMES[Math.floor(rand() * PRIMEIROS_NOMES.length)];
  const sobrenome = SOBRENOMES[Math.floor(rand() * SOBRENOMES.length)];
  return `${primeiro} ${sobrenome}`;
}

// PRNG simples e determinístico para gerar sempre os mesmos dados de teste
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const rand = mulberry32(42);

  console.log("Limpando dados existentes...");
  await prisma.invite.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.table.deleteMany();
  await prisma.guest.deleteMany();

  console.log("Criando mesas e lugares de exemplo (10 mesas x 8 lugares)...");
  const QUANTIDADE_MESAS = 10;
  const CAPACIDADE = 8;

  const tables = [];
  for (let n = 1; n <= QUANTIDADE_MESAS; n++) {
    const table = await prisma.table.create({
      data: {
        number: n,
        capacity: CAPACIDADE,
        label: n === 1 ? "Mesa dos noivos" : null,
        seats: {
          create: Array.from({ length: CAPACIDADE }, (_, i) => ({
            seatNumber: i + 1,
          })),
        },
      },
      include: { seats: true },
    });
    tables.push(table);
  }

  const allSeats = tables.flatMap((t) => t.seats);

  console.log("Criando convidados e convites de exemplo...");
  let inviteNumber = 1;
  let seatCursor = 0;

  for (let i = 0; i < 20; i++) {
    const titular = nomeAleatorio(rand);
    const guest = await prisma.guest.create({
      data: {
        name: titular,
        phone:
          rand() > 0.3
            ? `(11) 9${Math.floor(1000 + rand() * 8999)}-${Math.floor(1000 + rand() * 8999)}`
            : null,
        notes: rand() > 0.85 ? "Confirmar restrição alimentar." : null,
      },
    });

    const quantidadeConvites = 1 + Math.floor(rand() * 3); // 1 a 3 convites por titular

    for (let c = 0; c < quantidadeConvites; c++) {
      const usaOutroNome = rand() > 0.6;
      const attendeeName = usaOutroNome ? nomeAleatorio(rand) : titular;

      const statusRoll = rand();
      const paymentStatus = statusRoll < 0.6 ? "PAGO" : statusRoll < 0.85 ? "PENDENTE" : "PARCIAL";

      const giftType = rand() > 0.5 ? "CONVITE_CAMISA_CANECA" : "SOMENTE_CONVITE";
      const price = giftType === "CONVITE_CAMISA_CANECA" ? 180 : 120;

      const atribuirLugar = seatCursor < allSeats.length && rand() > 0.25;
      const seat = atribuirLugar ? allSeats[seatCursor] : null;
      if (atribuirLugar) seatCursor++;

      const fezCheckin = seat !== null && rand() > 0.6;

      await prisma.invite.create({
        data: {
          number: inviteNumber++,
          guestId: guest.id,
          attendeeName,
          price,
          paymentStatus,
          paymentMethod:
            paymentStatus !== "PENDENTE"
              ? FORMAS_PAGAMENTO[Math.floor(rand() * FORMAS_PAGAMENTO.length)]
              : null,
          giftType,
          seatId: seat?.id,
          checkedIn: fezCheckin,
          checkedInAt: fezCheckin ? new Date() : null,
        },
      });
    }
  }

  const totalConvites = await prisma.invite.count();
  console.log(`Seed concluído: ${tables.length} mesas, ${allSeats.length} lugares, ${totalConvites} convites.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
