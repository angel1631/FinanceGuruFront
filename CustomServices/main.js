import { useEffect, useState } from "react";
import { GCard } from "../../Core/components/GCard";
import { cookie_in_cookies_string } from "../../Core/scripts/cookie";
import { communication } from "../../Core/scripts/communication";
import { GModal } from "../../Core/components/GModal";
import { AddMovimiento } from "./agregar_movimiento";
import { cast_money } from "../../Core/scripts/casts";
import { getContrast } from "../../Core/scripts/color";
import { useRouter } from 'next/router';
import { errorAlert, successAlert } from "../../Core/scripts/alerts";


export async function server_props(context){
    try{
        let session_token = cookie_in_cookies_string({name: 'session_token',cookies_string: context.req.headers.cookie});
        let now = new Date();
        let start = (new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
        let end = (new Date(now.getFullYear(), now.getMonth()+1,0)).toISOString();
        //let start = `${now.getFullYear()}-${((now.getMonth())+1)<10?"0"+((now.getMonth())+1):((now.getMonth())+1)}-01`;
        let data = {start,end};
        console.log("iiiidata",data)
        const resumen_clasificacion = await communication({url:`/api/FinanceGuru/Services/resumen_movimientos`, data,session_token});
        
        
        let total_resumen = 0;
        resumen_clasificacion.map(r=>{
          total_resumen += parseFloat(r.balance);
        })
        return {resumen: resumen_clasificacion, total_resumen};
    }catch(error){
        console.log("Error SSR: ",error);
        return { error  }
    }
}

export default function main({server_props}){
    const router = useRouter();
    
    if(server_props.error?.http_code ==401) router.push("/login");
    if(server_props?.error?.http_code==403) return(<Error txt={"El usuario no tiene acceso al recurso"}/>);
    
    let resumen = useState(server_props.resumen?server_props.resumen.map(r=>({...r,movimientos:[]})):[]);
    let total_resumen = useState(server_props.total_resumen);
    let now = new Date();
    let start_date = new Date(now.getFullYear(), now.getMonth(), 1);
    let end_date = new Date(now.getFullYear(), now.getMonth()+1,0);
    let fechas = useState({start: start_date.getFullYear()+"-"+(("0" + (start_date.getMonth() + 1)).slice(-2))+"-"+(("0" + start_date.getDate()).slice(-2)) , 
        end: end_date.getFullYear()+"-"+(("0" + (end_date.getMonth() + 1)).slice(-2))+"-"+(("0" + end_date.getDate()).slice(-2)) });
    let show_form_movimientos = useState(false);
    let show_fechas = useState(false);
    let selected_date = useState('current');
   
    function grafica(){
      let grafica_div =  echarts.init(document.getElementById('grafica_resumen'));
      var options = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: 'Gastos',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            colorBy:'data',
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 30,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: resumen[0].map(r=>({value:r.balance,name:r.title,itemStyle:{color:r.color}})) 
          }
        ]
      };
      grafica_div.setOption(options);
    }
    useEffect(()=>{
      
      grafica();
    },[resumen])
    async function get_resumen(start='',end=''){
      if(start && end){
        start = new Date(start).toISOString();
        end = new Date(end).toISOString();
      }else{
        let now = new Date();
        start = (new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
        end = (new Date(now.getFullYear(), now.getMonth()+1,0)).toISOString();
        if(fechas[0]?.start && fechas[0]?.end){
          start = new Date(fechas[0].start).toISOString();
          end = new Date(fechas[0].end).toISOString()
        }
      }
        //let start = `${now.getFullYear()}-${((now.getMonth())+1)<10?"0"+((now.getMonth())+1):((now.getMonth())+1)}-01`;
      let data = {start,end};
      const resumen_clasificacion = await communication({url:`/api/FinanceGuru/Services/resumen_movimientos`, data});
      let total = 0;
      let resumen_f = resumen_clasificacion.map(r=>{
        total += parseFloat(r.balance);
        return {...r,movimientos:[]}
      });
      resumen[1](resumen_f);
      total_resumen[1](total);
    }
    async function cargar_movimientos(id,el){
      
      if(el.target.textContent.indexOf('down')>=0){
        let url = '/api/FinanceGuru/Services/buscar_movimientos';
        let now = new Date();
        let start = (new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
        let end = (new Date(now.getFullYear(), now.getMonth()+1,0)).toISOString();
        if(fechas[0]?.start && fechas[0]?.end){
          start = new Date(fechas[0].start).toISOString();
          end = new Date(fechas[0].end).toISOString()
        }
        let respuesta_json = await communication({url, data: {TagId: id, start,end}});
        let new_resumen = resumen[0].map((e)=>{
          if(e.id==id)
            return {...e,movimientos:respuesta_json};
          else return e;
        });
        resumen[1](new_resumen);
        el.target.textContent = 'arrow_drop_up';
      }else{
        el.target.textContent = 'arrow_drop_down';
        let new_resumen = resumen[0].map((e)=>{
          if(e.id==id)
            return {...e,movimientos:[]};
          else return e;
        });
        resumen[1](new_resumen)
      }
    }
    function onClouseAddMovimiento(){
      get_resumen();
      grafica();
    }
    function after_save_movimiento(){
      show_form_movimientos[1](false);
      get_resumen();
    }
    async function delete_movimiento({id}){
      try{
          if(window.confirm("Esta seguro de eliminar el gasto")){
              let response = await communication({url: "/api/FinanceGuru/FGMovimiento/delete", data: {id}});
              if(response.cod == 0) throw response.message
              successAlert("Todo Ok");
              get_resumen();
          }
      }catch(err){
          errorAlert(err);
      }
    }
    function change_fecha(e,id){
      let valor = e.target.value;
      fechas[1]({...fechas[0], [id]:valor})
    }
    function set_month(month){
      let now = new Date();
      let start_date;
      let end_date;
      if(month=='current'){
        start_date = new Date(now.getFullYear(), now.getMonth(), 1);
        end_date = new Date(now.getFullYear(), now.getMonth()+1,0);
        selected_date[1]('current');
        
      }else if(month=='last'){
        start_date = new Date(now.getFullYear(), now.getMonth()-1, 1);
        end_date = new Date(now.getFullYear(), now.getMonth(),0);
        selected_date[1]('last');
        
      }
      
      fechas[1]({start: start_date.getFullYear()+"-"+(("0" + (start_date.getMonth() + 1)).slice(-2))+"-"+(("0" + start_date.getDate()).slice(-2)) , 
        end: end_date.getFullYear()+"-"+(("0" + (end_date.getMonth() + 1)).slice(-2))+"-"+(("0" + end_date.getDate()).slice(-2)) });
        get_resumen(start_date.getFullYear()+"-"+(("0" + (start_date.getMonth() + 1)).slice(-2))+"-"+(("0" + start_date.getDate()).slice(-2)), end_date.getFullYear()+"-"+(("0" + (end_date.getMonth() + 1)).slice(-2))+"-"+(("0" + end_date.getDate()).slice(-2)));
      }
    return (
        <div>
          {show_form_movimientos[0] && 
            <GModal show={show_form_movimientos} title={`Agregar Movimientos`} onClouse={onClouseAddMovimiento}>
                <AddMovimiento after_save={after_save_movimiento}/>
            </GModal>
          }
          <GCard>
              <div className="button_add_move_container">
              <div className="move_add_button active_pulse" onClick={(e)=>{show_form_movimientos[1](true)}}>
                  Agregar un gasto
              </div>
              </div>

              
              <div id="grafica_resumen" className="grafica_resumen" ></div>
              <div className="total_resumen_container">
                <label>Q. {cast_money({amount: total_resumen[0]})}</label>
              </div>
              <div className="date_menu">
                <div className={`gastos_mes_button date_menu_option ${selected_date[0]=='current'? 'active_date': ''}`} onClick={()=>{set_month('current');}}>
                  Gastos del mes
                </div>
                <div className={`gastos_mes_button date_menu_option ${selected_date[0]=='last'? 'active_date': ''}`} onClick={()=>{set_month('last');}}>
                  Gastos mes pasado
                </div>
                <div className="fechas_trigger date_menu_option" onClick={()=>{show_fechas[1](!show_fechas[0])}}>
                  Otra fecha <i className="material-icons-outlined">navigate_next</i>
                </div>
              </div>
              
              {show_fechas[0] &&  
                <div className="fechas">
                  <input type="date" value={fechas[0].start} onChange={(e)=>{change_fecha(e,'start')}}/>
                  <input type="date" value={fechas[0].end} onChange={(e)=>{change_fecha(e,'end')}}/>
                  <i className="material-icons-outlined refresh_icon" onClick={()=>{selected_date[1]("");get_resumen();}}>refresh</i>
                </div>}
              
              
          </GCard>
          {resumen[0].map((e,index_a)=>{
            let contraste = getContrast(e.color, '#FFFFFF');
            let new_style = {background: e.color};
            if(contraste>4) new_style.color = "#FFFFFF";
            return (
              <div className="resumen_tag" style={new_style} key={index_a}>
                  <div className="head_resumen_tag">
                    <i className="info icon material-icons-outlined">{e.icon}</i>
                    <label className="info title">{e.title}</label>
                    <label className="info balance">Q. {cast_money({amount:e.balance})}</label>
                    <div className="expandir" onClick={(c)=>{cargar_movimientos(e.id,c)}}>
                      <i className="material-icons-outlined icon_movimientos">arrow_drop_down</i>
                    </div>
                  </div>
                  {e.movimientos.length>0 &&
                    <div className="detalle_resumen_tag">
                      {e.movimientos.map((m,index)=>(
                        <div className="contenedor_movimiento">
                          <div className="movimiento" key={index}>
                            <label>{m.fecha}</label>
                            <label>{m.description}</label>
                            <label>Q. {cast_money({amount: m.amount})}</label>
                            
                          </div>
                          <i className="material-icons-outlined btn_delete_move" onClick={()=>{delete_movimiento({id: m.id})}}>delete</i>
                        </div>
                      ))}
                    </div>
                  }
              </div>
          )})}
          
      </div>
    );
}


