import platform
import psutil
import socket
import os
import smtplib
import subprocess
import uuid
import json
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
try:
    import wmi
    WMI_AVAILABLE = True
except:
    WMI_AVAILABLE = False


# =========================
# CONFIG SMTP (TUS DATOS)
# =========================
SMTP_CONFIG = {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "visioncompanyone@gmail.com",
    "password": "ukhp hrzc qdhs kvfc",
    "from_email": "visioncompanyone@gmail.com",
    "from_name": "OneVisionRecoleccion",
    "to_email": "fnalbandian@gmail.com"
}


# =========================
# INFO DEL SISTEMA
# =========================
def obtener_info_pc():
    info = {}

    info["fecha"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    info["hostname"] = socket.gethostname()

    try:
        info["ip_local"] = socket.gethostbyname(socket.gethostname())
    except:
        info["ip_local"] = "No disponible"

    # --- SISTEMA OPERATIVO ---
    info["sistema"] = {
        "os": platform.system(),
        "nombre": platform.node(),
        "version": platform.version(),
        "release": platform.release(),
        "arquitectura": platform.machine(),
        "procesador": platform.processor(),
        "plataforma": platform.platform(),
        "python_version": platform.python_version()
    }

    # --- IDENTIFICADOR ÚNICO DE MÁQUINA ---
    try:
        info["uuid_maquina"] = str(uuid.UUID(int=uuid.getnode()))
    except:
        info["uuid_maquina"] = "No disponible"

    # --- INFORMACIÓN DE HARDWARE (WMI para Windows) ---
    info["hardware"] = obtener_info_hardware()

    # --- USUARIOS ---
    info["usuarios"] = []
    for u in psutil.users():
        info["usuarios"].append({
            "usuario": u.name,
            "terminal": u.terminal,
            "host": u.host,
            "inicio": datetime.fromtimestamp(u.started).strftime("%Y-%m-%d %H:%M:%S")
        })

    # --- CPU ---
    cpu_freq = psutil.cpu_freq()
    cpu_stats = psutil.cpu_stats()
    info["cpu"] = {
        "nucleos_fisicos": psutil.cpu_count(logical=False),
        "nucleos_logicos": psutil.cpu_count(logical=True),
        "uso_porcentaje": psutil.cpu_percent(interval=1),
        "uso_por_core": psutil.cpu_percent(interval=1, percpu=True),
        "frecuencia_actual_mhz": cpu_freq.current if cpu_freq else "N/A",
        "frecuencia_max_mhz": cpu_freq.max if cpu_freq else "N/A",
        "frecuencia_min_mhz": cpu_freq.min if cpu_freq else "N/A",
        "cambios_contexto": cpu_stats.ctx_switches if hasattr(cpu_stats, 'ctx_switches') else "N/A",
        "interrupciones": cpu_stats.interrupts if hasattr(cpu_stats, 'interrupts') else "N/A",
        "llamadas_sistema": cpu_stats.syscalls if hasattr(cpu_stats, 'syscalls') else "N/A"
    }

    # --- MEMORIA ---
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    info["memoria"] = {
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_usada_gb": round(mem.used / 1024**3, 2),
        "ram_libre_gb": round(mem.available / 1024**3, 2),
        "ram_porcentaje": mem.percent,
        "ram_buffers_gb": round(mem.buffers / 1024**3, 2) if hasattr(mem, 'buffers') else "N/A",
        "ram_cached_gb": round(mem.cached / 1024**3, 2) if hasattr(mem, 'cached') else "N/A",
        "swap_total_gb": round(swap.total / 1024**3, 2),
        "swap_usada_gb": round(swap.used / 1024**3, 2),
        "swap_libre_gb": round(swap.free / 1024**3, 2),
        "swap_porcentaje": swap.percent
    }

    # --- DISCOS ---
    info["discos"] = []
    for p in psutil.disk_partitions():
        try:
            uso = psutil.disk_usage(p.mountpoint)
            info["discos"].append({
                "dispositivo": p.device,
                "montaje": p.mountpoint,
                "tipo": p.fstype,
                "opciones": p.opts,
                "total_gb": round(uso.total / 1024**3, 2),
                "usado_gb": round(uso.used / 1024**3, 2),
                "libre_gb": round(uso.free / 1024**3, 2),
                "uso_porcentaje": uso.percent
            })
        except:
            pass

    # --- ESTADÍSTICAS DE DISCO I/O ---
    try:
        disk_io = psutil.disk_io_counters()
        info["disco_io"] = {
            "lectura_count": disk_io.read_count,
            "escritura_count": disk_io.write_count,
            "lectura_bytes_gb": round(disk_io.read_bytes / 1024**3, 2),
            "escritura_bytes_gb": round(disk_io.write_bytes / 1024**3, 2),
            "lectura_tiempo_ms": disk_io.read_time,
            "escritura_tiempo_ms": disk_io.write_time
        }
    except:
        info["disco_io"] = "No disponible"

    # --- RED ---
    info["red"] = []
    for iface, addrs in psutil.net_if_addrs().items():
        datos = {"interfaz": iface}
        for addr in addrs:
            if addr.family == socket.AF_INET:
                datos["ip"] = addr.address
                datos["netmask"] = addr.netmask
            elif addr.family == psutil.AF_LINK:
                datos["mac"] = addr.address
        info["red"].append(datos)

    # --- ESTADÍSTICAS DE RED ---
    try:
        net_io = psutil.net_io_counters()
        info["red_stats"] = {
            "bytes_enviados_gb": round(net_io.bytes_sent / 1024**3, 2),
            "bytes_recibidos_gb": round(net_io.bytes_recv / 1024**3, 2),
            "paquetes_enviados": net_io.packets_sent,
            "paquetes_recibidos": net_io.packets_recv,
            "errores_entrada": net_io.errin,
            "errores_salida": net_io.errout,
            "paquetes_descartados_entrada": net_io.dropin,
            "paquetes_descartados_salida": net_io.dropout
        }
    except:
        info["red_stats"] = "No disponible"

    # --- CONEXIONES DE RED ACTIVAS ---
    try:
        conexiones = psutil.net_connections(kind='inet')
        info["conexiones_activas"] = len(conexiones)
        info["conexiones_establecidas"] = len([c for c in conexiones if c.status == 'ESTABLISHED'])
    except:
        info["conexiones_activas"] = "No disponible"
        info["conexiones_establecidas"] = "No disponible"

    # --- PROCESOS (TOP 20) ---
    procesos = []
    for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'create_time']):
        try:
            p_info = p.info
            p_info['tiempo_ejecucion'] = round((datetime.now().timestamp() - p_info['create_time']) / 3600, 2) if p_info['create_time'] else 0
            procesos.append(p_info)
        except:
            pass

    info["procesos_top_cpu"] = sorted(
        procesos,
        key=lambda x: (x['cpu_percent'] or 0),
        reverse=True
    )[:20]

    info["procesos_top_memoria"] = sorted(
        procesos,
        key=lambda x: (x['memory_percent'] or 0),
        reverse=True
    )[:20]

    info["total_procesos"] = len(procesos)

    # --- UPTIME ---
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    info["boot_time"] = boot_time.strftime("%Y-%m-%d %H:%M:%S")
    info["uptime_horas"] = round(
        (datetime.now().timestamp() - psutil.boot_time()) / 3600, 2
    )

    # --- BATERÍA (si existe) ---
    try:
        battery = psutil.sensors_battery()
        if battery:
            info["bateria"] = {
                "porcentaje": battery.percent,
                "conectada": battery.power_plugged,
                "tiempo_restante_min": round(battery.secsleft / 60, 2) if battery.secsleft != psutil.POWER_TIME_UNLIMITED else "Conectada"
            }
        else:
            info["bateria"] = "No disponible (PC de escritorio)"
    except:
        info["bateria"] = "No disponible"

    # --- TEMPERATURA (si disponible) ---
    try:
        temps = psutil.sensors_temperatures()
        if temps:
            info["temperatura"] = {}
            for name, entries in temps.items():
                info["temperatura"][name] = [{"etiqueta": e.label or name, "actual": e.current, "critica": e.critical if e.critical else "N/A"} for e in entries]
        else:
            info["temperatura"] = "No disponible"
    except:
        info["temperatura"] = "No disponible"

    # --- VENTILADORES (si disponible) ---
    try:
        fans = psutil.sensors_fans()
        if fans:
            info["ventiladores"] = {}
            for name, entries in fans.items():
                info["ventiladores"][name] = [{"etiqueta": e.label or name, "rpm": e.current} for e in entries]
        else:
            info["ventiladores"] = "No disponible"
    except:
        info["ventiladores"] = "No disponible"

    # --- VARIABLES DE ENTORNO IMPORTANTES ---
    info["env_vars"] = {
        "PATH": os.environ.get("PATH", "N/A")[:200] + "...",  # Truncado
        "TEMP": os.environ.get("TEMP", "N/A"),
        "USERNAME": os.environ.get("USERNAME", "N/A"),
        "USERPROFILE": os.environ.get("USERPROFILE", "N/A"),
        "COMPUTERNAME": os.environ.get("COMPUTERNAME", "N/A"),
        "PROCESSOR_IDENTIFIER": os.environ.get("PROCESSOR_IDENTIFIER", "N/A")
    }

    return info


def obtener_info_hardware():
    """Obtiene información detallada de hardware usando WMI (Windows) o comandos del sistema"""
    hardware_info = {}
    
    if platform.system() == "Windows" and WMI_AVAILABLE:
        try:
            c = wmi.WMI()
            
            # BIOS
            for bios in c.Win32_BIOS():
                hardware_info["bios"] = {
                    "fabricante": bios.Manufacturer,
                    "version": bios.Version,
                    "fecha": bios.ReleaseDate
                }
                break
            
            # Placa Base
            for board in c.Win32_BaseBoard():
                hardware_info["placa_base"] = {
                    "fabricante": board.Manufacturer,
                    "producto": board.Product,
                    "serial": board.SerialNumber
                }
                break
            
            # Procesador
            for cpu in c.Win32_Processor():
                hardware_info["procesador"] = {
                    "nombre": cpu.Name,
                    "fabricante": cpu.Manufacturer,
                    "max_clock_mhz": cpu.MaxClockSpeed,
                    "cores": cpu.NumberOfCores,
                    "threads": cpu.NumberOfLogicalProcessors,
                    "arquitectura": cpu.Architecture
                }
                break
            
            # Memoria física
            hardware_info["modulos_ram"] = []
            for mem in c.Win32_PhysicalMemory():
                hardware_info["modulos_ram"].append({
                    "capacidad_gb": round(int(mem.Capacity) / 1024**3, 2),
                    "velocidad_mhz": mem.Speed,
                    "fabricante": mem.Manufacturer,
                    "tipo": mem.MemoryType
                })
            
            # Tarjeta de video
            hardware_info["gpu"] = []
            for gpu in c.Win32_VideoController():
                hardware_info["gpu"].append({
                    "nombre": gpu.Name,
                    "driver_version": gpu.DriverVersion,
                    "ram_mb": round(int(gpu.AdapterRAM) / 1024**2, 2) if gpu.AdapterRAM else "N/A",
                    "resolucion": f"{gpu.CurrentHorizontalResolution}x{gpu.CurrentVerticalResolution}" if gpu.CurrentHorizontalResolution else "N/A"
                })
            
            # Discos duros físicos
            hardware_info["discos_fisicos"] = []
            for disk in c.Win32_DiskDrive():
                hardware_info["discos_fisicos"].append({
                    "modelo": disk.Model,
                    "interface": disk.InterfaceType,
                    "tamaño_gb": round(int(disk.Size) / 1024**3, 2) if disk.Size else "N/A",
                    "particiones": disk.Partitions
                })
            
            # Adaptadores de red
            hardware_info["adaptadores_red"] = []
            for adapter in c.Win32_NetworkAdapter():
                if adapter.PhysicalAdapter and adapter.MACAddress:
                    hardware_info["adaptadores_red"].append({
                        "nombre": adapter.Name,
                        "mac": adapter.MACAddress,
                        "fabricante": adapter.Manufacturer,
                        "velocidad_mbps": adapter.Speed if adapter.Speed else "N/A"
                    })
            
        except Exception as e:
            hardware_info["error"] = f"Error al obtener info WMI: {str(e)}"
    
    elif platform.system() == "Windows":
        # Intentar con comandos de PowerShell/CMD si WMI no está disponible
        try:
            result = subprocess.run(
                ["powershell", "-Command", "Get-ComputerInfo | Select-Object CsManufacturer, CsModel, BiosVersion | ConvertTo-Json"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                hardware_info["info_basica"] = json.loads(result.stdout)
        except:
            hardware_info["info_basica"] = "No disponible sin WMI"
    
    return hardware_info


# =========================
# ARMAR EMAIL HTML
# =========================
def generar_html(data):
    # Función auxiliar para crear barras de progreso
    def barra_progreso(porcentaje, color=""):
        if color == "":
            if porcentaje < 50:
                color = "#4CAF50"
            elif porcentaje < 75:
                color = "#FF9800"
            else:
                color = "#F44336"
        
        return f"""
        <div style="background:#e0e0e0; border-radius:10px; overflow:hidden; height:25px; position:relative;">
            <div style="background:{color}; width:{porcentaje}%; height:100%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:12px;">
                {porcentaje}%
            </div>
        </div>
        """
    
    # Función para crear tarjetas
    def crear_tarjeta(titulo, contenido, icono="📊"):
        return f"""
        <div style="background:white; border-radius:10px; padding:20px; margin:15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="color:#2c3e50; margin-top:0; border-bottom:2px solid #3498db; padding-bottom:10px;">
                {icono} {titulo}
            </h3>
            {contenido}
        </div>
        """
    
    # RESUMEN PRINCIPAL
    resumen = f"""
    <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:30px; border-radius:15px; margin-bottom:20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <h1 style="margin:0; font-size:32px;">🖥️ Reporte Completo del Sistema</h1>
        <p style="font-size:18px; margin:10px 0 0 0;">
            <b>{data['hostname']}</b> • {data['ip_local']} • {data['fecha']}
        </p>
    </div>
    """
    
    # SISTEMA OPERATIVO
    sistema_html = f"""
    <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Sistema:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['sistema']['os']} {data['sistema']['release']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Versión:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['sistema']['version']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Arquitectura:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['sistema']['arquitectura']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Procesador:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['sistema']['procesador']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Plataforma:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['sistema']['plataforma']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Python:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['sistema']['python_version']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>UUID Máquina:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['uuid_maquina']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Boot Time:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['boot_time']}</td></tr>
        <tr><td style="padding:8px;"><b>Uptime:</b></td><td style="padding:8px;">{data['uptime_horas']} horas</td></tr>
    </table>
    """
    
    # HARDWARE DETALLADO
    hardware_html = "<p><i>Información de hardware no disponible</i></p>"
    if data.get('hardware'):
        hw = data['hardware']
        hardware_sections = []
        
        if 'bios' in hw:
            hardware_sections.append(f"<p><b>🔧 BIOS:</b> {hw['bios']['fabricante']} - {hw['bios']['version']}</p>")
        
        if 'placa_base' in hw:
            hardware_sections.append(f"<p><b>🔌 Placa Base:</b> {hw['placa_base']['fabricante']} {hw['placa_base']['producto']}</p>")
        
        if 'procesador' in hw:
            proc = hw['procesador']
            hardware_sections.append(f"<p><b>⚡ CPU:</b> {proc['nombre']}<br><small>{proc['cores']} cores, {proc['threads']} threads @ {proc['max_clock_mhz']} MHz</small></p>")
        
        if 'modulos_ram' in hw and hw['modulos_ram']:
            ram_info = "<p><b>💾 Módulos RAM:</b></p><ul>"
            for ram in hw['modulos_ram']:
                ram_info += f"<li>{ram['capacidad_gb']} GB @ {ram['velocidad_mhz']} MHz - {ram['fabricante']}</li>"
            ram_info += "</ul>"
            hardware_sections.append(ram_info)
        
        if 'gpu' in hw and hw['gpu']:
            gpu_info = "<p><b>🎮 GPU:</b></p><ul>"
            for gpu in hw['gpu']:
                gpu_info += f"<li>{gpu['nombre']}<br><small>RAM: {gpu['ram_mb']} MB | Resolución: {gpu['resolucion']}</small></li>"
            gpu_info += "</ul>"
            hardware_sections.append(gpu_info)
        
        if 'discos_fisicos' in hw and hw['discos_fisicos']:
            disk_info = "<p><b>💿 Discos Físicos:</b></p><ul>"
            for disk in hw['discos_fisicos']:
                disk_info += f"<li>{disk['modelo']} ({disk['interface']})<br><small>{disk['tamaño_gb']} GB | {disk['particiones']} particiones</small></li>"
            disk_info += "</ul>"
            hardware_sections.append(disk_info)
        
        hardware_html = "".join(hardware_sections)
    
    # CPU
    cpu_uso_cores = "<div style='display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;'>"
    if isinstance(data['cpu']['uso_por_core'], list):
        for idx, uso in enumerate(data['cpu']['uso_por_core']):
            cpu_uso_cores += f"""
            <div style="flex:0 0 100px; text-align:center;">
                <small>Core {idx}</small>
                <div style="background:#e0e0e0; border-radius:5px; overflow:hidden; height:15px; margin:5px 0;">
                    <div style="background:#3498db; width:{uso}%; height:100%;"></div>
                </div>
                <small>{uso}%</small>
            </div>
            """
    cpu_uso_cores += "</div>"
    
    cpu_html = f"""
    <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Núcleos físicos:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['cpu']['nucleos_fisicos']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Núcleos lógicos:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['cpu']['nucleos_logicos']}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Frecuencia actual:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['cpu']['frecuencia_actual_mhz']} MHz</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Frecuencia máxima:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['cpu']['frecuencia_max_mhz']} MHz</td></tr>
    </table>
    <p style="margin-top:15px;"><b>Uso General:</b></p>
    {barra_progreso(data['cpu']['uso_porcentaje'])}
    <p style="margin-top:15px;"><b>Uso por Core:</b></p>
    {cpu_uso_cores}
    """
    
    # MEMORIA
    memoria_html = f"""
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div>
            <p><b>💾 RAM</b></p>
            <p>Total: {data['memoria']['ram_total_gb']} GB</p>
            <p>Usada: {data['memoria']['ram_usada_gb']} GB</p>
            <p>Libre: {data['memoria']['ram_libre_gb']} GB</p>
            {barra_progreso(data['memoria']['ram_porcentaje'])}
        </div>
        <div>
            <p><b>💿 SWAP</b></p>
            <p>Total: {data['memoria']['swap_total_gb']} GB</p>
            <p>Usada: {data['memoria']['swap_usada_gb']} GB</p>
            <p>Libre: {data['memoria']['swap_libre_gb']} GB</p>
            {barra_progreso(data['memoria']['swap_porcentaje'])}
        </div>
    </div>
    """
    
    # DISCOS
    discos_html = ""
    for disco in data['discos']:
        discos_html += f"""
        <div style="margin-bottom:20px; padding:15px; background:#f9f9f9; border-radius:8px;">
            <p style="margin:0 0 10px 0;"><b>💾 {disco['dispositivo']}</b></p>
            <p style="margin:5px 0; font-size:13px; color:#666;">
                Montaje: {disco['montaje']} | Tipo: {disco['tipo']} | Opciones: {disco['opciones']}
            </p>
            <p style="margin:5px 0;">
                {disco['usado_gb']} GB / {disco['total_gb']} GB (Libre: {disco['libre_gb']} GB)
            </p>
            {barra_progreso(disco['uso_porcentaje'])}
        </div>
        """
    
    # DISCO I/O
    disco_io_html = ""
    if isinstance(data['disco_io'], dict):
        disco_io_html = f"""
        <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Lecturas:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['disco_io']['lectura_count']:,} ({data['disco_io']['lectura_bytes_gb']} GB)</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Escrituras:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['disco_io']['escritura_count']:,} ({data['disco_io']['escritura_bytes_gb']} GB)</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Tiempo lectura:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['disco_io']['lectura_tiempo_ms']:,} ms</td></tr>
            <tr><td style="padding:8px;"><b>Tiempo escritura:</b></td><td style="padding:8px;">{data['disco_io']['escritura_tiempo_ms']:,} ms</td></tr>
        </table>
        """
    else:
        disco_io_html = f"<p>{data['disco_io']}</p>"
    
    # RED
    red_html = ""
    for iface in data['red']:
        red_html += f"""
        <div style="margin-bottom:15px; padding:12px; background:#f9f9f9; border-radius:8px;">
            <p style="margin:0; font-weight:bold;">🌐 {iface['interfaz']}</p>
            <p style="margin:5px 0; font-size:13px;">
                IP: {iface.get('ip', 'N/A')} | 
                MAC: {iface.get('mac', 'N/A')} | 
                Netmask: {iface.get('netmask', 'N/A')}
            </p>
        </div>
        """
    
    # ESTADÍSTICAS DE RED
    red_stats_html = ""
    if isinstance(data['red_stats'], dict):
        red_stats_html = f"""
        <table style="width:100%; border-collapse:collapse; margin-top:15px;">
            <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>📤 Enviados:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['red_stats']['bytes_enviados_gb']} GB ({data['red_stats']['paquetes_enviados']:,} paquetes)</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>📥 Recibidos:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">{data['red_stats']['bytes_recibidos_gb']} GB ({data['red_stats']['paquetes_recibidos']:,} paquetes)</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>❌ Errores:</b></td><td style="padding:8px; border-bottom:1px solid #eee;">Entrada: {data['red_stats']['errores_entrada']} | Salida: {data['red_stats']['errores_salida']}</td></tr>
            <tr><td style="padding:8px;"><b>🔌 Conexiones:</b></td><td style="padding:8px;">Activas: {data['conexiones_activas']} | Establecidas: {data['conexiones_establecidas']}</td></tr>
        </table>
        """
    
    # PROCESOS TOP CPU
    procesos_cpu_html = "<table style='width:100%; border-collapse:collapse; font-size:12px;'>"
    procesos_cpu_html += "<tr style='background:#f0f0f0; font-weight:bold;'><td style='padding:8px;'>PID</td><td style='padding:8px;'>Nombre</td><td style='padding:8px;'>CPU %</td><td style='padding:8px;'>Memoria %</td><td style='padding:8px;'>Estado</td></tr>"
    for p in data['procesos_top_cpu'][:15]:
        procesos_cpu_html += f"<tr style='border-bottom:1px solid #eee;'><td style='padding:8px;'>{p['pid']}</td><td style='padding:8px;'>{p['name']}</td><td style='padding:8px;'>{p['cpu_percent']:.1f}%</td><td style='padding:8px;'>{p['memory_percent']:.1f}%</td><td style='padding:8px;'>{p['status']}</td></tr>"
    procesos_cpu_html += "</table>"
    
    # PROCESOS TOP MEMORIA
    procesos_mem_html = "<table style='width:100%; border-collapse:collapse; font-size:12px;'>"
    procesos_mem_html += "<tr style='background:#f0f0f0; font-weight:bold;'><td style='padding:8px;'>PID</td><td style='padding:8px;'>Nombre</td><td style='padding:8px;'>Memoria %</td><td style='padding:8px;'>CPU %</td><td style='padding:8px;'>Tiempo ejecución (h)</td></tr>"
    for p in data['procesos_top_memoria'][:15]:
        procesos_mem_html += f"<tr style='border-bottom:1px solid #eee;'><td style='padding:8px;'>{p['pid']}</td><td style='padding:8px;'>{p['name']}</td><td style='padding:8px;'>{p['memory_percent']:.1f}%</td><td style='padding:8px;'>{p['cpu_percent']:.1f}%</td><td style='padding:8px;'>{p['tiempo_ejecucion']}</td></tr>"
    procesos_mem_html += "</table>"
    
    # USUARIOS
    usuarios_html = ""
    if data['usuarios']:
        for u in data['usuarios']:
            usuarios_html += f"""
            <div style="margin-bottom:10px; padding:10px; background:#f9f9f9; border-radius:8px;">
                <p style="margin:0;"><b>👤 {u['usuario']}</b></p>
                <p style="margin:5px 0 0 0; font-size:13px; color:#666;">
                    Terminal: {u['terminal']} | Host: {u['host']} | Inicio: {u['inicio']}
                </p>
            </div>
            """
    else:
        usuarios_html = "<p>No hay usuarios activos</p>"
    
    # BATERÍA
    bateria_html = ""
    if isinstance(data['bateria'], dict):
        estado = "🔌 Conectada" if data['bateria']['conectada'] else "🔋 Desconectada"
        bateria_html = f"""
        <p><b>Estado:</b> {estado}</p>
        <p><b>Nivel:</b></p>
        {barra_progreso(data['bateria']['porcentaje'], "#4CAF50" if data['bateria']['porcentaje'] > 20 else "#F44336")}
        <p style="margin-top:10px;"><b>Tiempo restante:</b> {data['bateria']['tiempo_restante_min']} minutos</p>
        """
    else:
        bateria_html = f"<p>{data['bateria']}</p>"
    
    # TEMPERATURA
    temp_html = ""
    if isinstance(data['temperatura'], dict) and data['temperatura']:
        for nombre, sensores in data['temperatura'].items():
            temp_html += f"<p><b>{nombre}:</b></p><ul>"
            for s in sensores:
                temp_html += f"<li>{s['etiqueta']}: {s['actual']}°C (Crítica: {s['critica']}°C)</li>"
            temp_html += "</ul>"
    else:
        temp_html = f"<p>{data['temperatura']}</p>"
    
    # VENTILADORES
    fans_html = ""
    if isinstance(data['ventiladores'], dict) and data['ventiladores']:
        for nombre, ventiladores in data['ventiladores'].items():
            fans_html += f"<p><b>{nombre}:</b></p><ul>"
            for v in ventiladores:
                fans_html += f"<li>{v['etiqueta']}: {v['rpm']} RPM</li>"
            fans_html += "</ul>"
    else:
        fans_html = f"<p>{data['ventiladores']}</p>"
    
    # VARIABLES DE ENTORNO
    env_html = "<table style='width:100%; border-collapse:collapse; font-size:12px;'>"
    for key, value in data['env_vars'].items():
        env_html += f"<tr style='border-bottom:1px solid #eee;'><td style='padding:8px; font-weight:bold;'>{key}</td><td style='padding:8px; word-break:break-all;'>{value}</td></tr>"
    env_html += "</table>"
    
    # ESTADÍSTICAS GENERALES
    stats_html = f"""
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:20px; border-radius:10px; text-align:center;">
            <h2 style="margin:0; font-size:36px;">{data['cpu']['uso_porcentaje']}%</h2>
            <p style="margin:5px 0 0 0;">Uso CPU</p>
        </div>
        <div style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:20px; border-radius:10px; text-align:center;">
            <h2 style="margin:0; font-size:36px;">{data['memoria']['ram_porcentaje']}%</h2>
            <p style="margin:5px 0 0 0;">Uso RAM</p>
        </div>
        <div style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color:white; padding:20px; border-radius:10px; text-align:center;">
            <h2 style="margin:0; font-size:36px;">{data['total_procesos']}</h2>
            <p style="margin:5px 0 0 0;">Procesos</p>
        </div>
        <div style="background:linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color:white; padding:20px; border-radius:10px; text-align:center;">
            <h2 style="margin:0; font-size:36px;">{data['uptime_horas']}h</h2>
            <p style="margin:5px 0 0 0;">Uptime</p>
        </div>
    </div>
    """
    
    # ENSAMBLAR TODO
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte del Sistema</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f4f6f8; padding:20px; margin:0;">
        <div style="max-width:1200px; margin:0 auto;">
            {resumen}
            {stats_html}
            {crear_tarjeta("Sistema Operativo", sistema_html, "🖥️")}
            {crear_tarjeta("Hardware Detallado", hardware_html, "🔧")}
            {crear_tarjeta("Procesador (CPU)", cpu_html, "⚙️")}
            {crear_tarjeta("Memoria RAM y SWAP", memoria_html, "💾")}
            {crear_tarjeta("Discos", discos_html, "💿")}
            {crear_tarjeta("Estadísticas de Disco I/O", disco_io_html, "📊")}
            {crear_tarjeta("Interfaces de Red", red_html, "🌐")}
            {crear_tarjeta("Estadísticas de Red", red_stats_html, "📡")}
            {crear_tarjeta("Procesos Top por CPU", procesos_cpu_html, "🚀")}
            {crear_tarjeta("Procesos Top por Memoria", procesos_mem_html, "💭")}
            {crear_tarjeta("Usuarios Activos", usuarios_html, "👥")}
            {crear_tarjeta("Batería", bateria_html, "🔋")}
            {crear_tarjeta("Temperatura", temp_html, "🌡️")}
            {crear_tarjeta("Ventiladores", fans_html, "🌀")}
            {crear_tarjeta("Variables de Entorno", env_html, "⚙️")}
            
            <div style="text-align:center; margin-top:30px; padding:20px; color:#666; font-size:12px;">
                <p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                <p style="font-size:14px;">📊 <b>Reporte generado automáticamente</b></p>
                <p>Sistema de monitoreo OneVision • {data['fecha']}</p>
                <p style="font-size:10px; color:#999;">Este reporte contiene información detallada del sistema para análisis y diagnóstico</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html


# =========================
# ENVIAR EMAIL
# =========================
def enviar_email(html):
    msg = MIMEMultipart("alternative")
    msg["From"] = f'{SMTP_CONFIG["from_name"]} <{SMTP_CONFIG["from_email"]}>'
    msg["To"] = SMTP_CONFIG["to_email"]
    msg["Subject"] = "🖥️ Reporte completo del estado de la PC"

    msg.attach(MIMEText(html, "html", "utf-8"))

    server = smtplib.SMTP(SMTP_CONFIG["host"], SMTP_CONFIG["port"])
    server.starttls()
    server.login(SMTP_CONFIG["user"], SMTP_CONFIG["password"])
    server.send_message(msg)
    server.quit()


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    try:
        info = obtener_info_pc()
        html = generar_html(info)
        enviar_email(html)
        print("Reporte enviado correctamente.")
    except Exception as e:
        print("Error:", e)


