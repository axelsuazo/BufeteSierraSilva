-- CreateTable
CREATE TABLE `clientes_bufete` (
    `id` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `correoElectronico` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `dni` VARCHAR(191) NULL,
    `lugarTrabajo` VARCHAR(191) NULL,
    `tipoCaso` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Consulta',
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_bufete_correoElectronico_key`(`correoElectronico`),
    UNIQUE INDEX `clientes_bufete_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bitacoras_cliente_bufete` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `fechaEntrada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descripcion` VARCHAR(191) NOT NULL,
    `tipoActuacion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id` VARCHAR(191) NOT NULL,
    `clienteBufeteId` VARCHAR(191) NULL,
    `nombreCliente` VARCHAR(191) NOT NULL,
    `apellidoCliente` VARCHAR(191) NOT NULL,
    `correoCliente` VARCHAR(191) NOT NULL,
    `telefonoCliente` VARCHAR(191) NULL,
    `dniCliente` VARCHAR(191) NULL,
    `lugarTrabajoCliente` VARCHAR(191) NULL,
    `tipoCasoCliente` VARCHAR(191) NULL,
    `fechaCita` DATETIME(3) NOT NULL,
    `horaCita` VARCHAR(191) NOT NULL,
    `tipoCita` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Programada',
    `notas` VARCHAR(191) NULL,
    `idEventoGoogleCalendar` VARCHAR(191) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `citas_idEventoGoogleCalendar_key`(`idEventoGoogleCalendar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensajes_contacto` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correoElectronico` VARCHAR(191) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `fechaRecepcion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `respondido` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes_prestamo` (
    `id` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `rtn` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `correoElectronico` VARCHAR(191) NOT NULL,
    `lugarTrabajo` VARCHAR(191) NOT NULL,
    `direccionTrabajo` VARCHAR(191) NULL,
    `direccionCasa` VARCHAR(191) NOT NULL,
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_prestamo_dni_key`(`dni`),
    UNIQUE INDEX `clientes_prestamo_rtn_key`(`rtn`),
    UNIQUE INDEX `clientes_prestamo_correoElectronico_key`(`correoElectronico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_prestamo` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `fechaSolicitud` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `montoSolicitado` DECIMAL(65, 30) NOT NULL,
    `tipoGarantia` ENUM('HIPOTECARIA', 'PRENDARIA', 'AVAL_SOLIDARIO', 'PAGARE', 'FIANZA', 'OTRA') NOT NULL,
    `descripcionGarantia` TEXT NULL,
    `estado` ENUM('PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'DESEMBOLSADO', 'EN_PAGO', 'PAGADO_COMPLETAMENTE', 'INCUMPLIMIENTO') NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    `montoAprobado` DECIMAL(65, 30) NULL,
    `fechaAprobacion` DATETIME(3) NULL,
    `fechaDesembolso` DATETIME(3) NULL,
    `plazoMeses` INTEGER NULL,
    `tasaInteresAnual` DECIMAL(65, 30) NULL,
    `notasDePago` TEXT NULL,
    `fechaUltimaActualizacion` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos_prestamo` (
    `id` VARCHAR(191) NOT NULL,
    `solicitudPrestamoId` VARCHAR(191) NOT NULL,
    `nombreDocumento` VARCHAR(191) NOT NULL,
    `tipoDocumento` VARCHAR(191) NOT NULL,
    `urlDocumento` VARCHAR(191) NULL,
    `tamanoBytes` INTEGER NULL,
    `fechaSubida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descripcion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos_prestamo` (
    `id` VARCHAR(191) NOT NULL,
    `solicitudPrestamoId` VARCHAR(191) NOT NULL,
    `fechaPago` DATETIME(3) NOT NULL,
    `montoPagado` DECIMAL(65, 30) NOT NULL,
    `metodoPago` VARCHAR(191) NULL,
    `referenciaPago` VARCHAR(191) NULL,
    `notas` TEXT NULL,
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bitacoras_cliente_bufete` ADD CONSTRAINT `bitacoras_cliente_bufete_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_bufete`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_clienteBufeteId_fkey` FOREIGN KEY (`clienteBufeteId`) REFERENCES `clientes_bufete`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_prestamo` ADD CONSTRAINT `solicitudes_prestamo_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_prestamo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos_prestamo` ADD CONSTRAINT `documentos_prestamo_solicitudPrestamoId_fkey` FOREIGN KEY (`solicitudPrestamoId`) REFERENCES `solicitudes_prestamo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos_prestamo` ADD CONSTRAINT `pagos_prestamo_solicitudPrestamoId_fkey` FOREIGN KEY (`solicitudPrestamoId`) REFERENCES `solicitudes_prestamo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
