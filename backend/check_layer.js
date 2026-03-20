const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const layer = await prisma.geologiaCapas.findFirst({
        where: { proyecto_id: 24, tab_name: 'geologia_local' },
        orderBy: { creado_en: 'desc' }
    });
    console.log("FILE URL:", layer.file_url);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
