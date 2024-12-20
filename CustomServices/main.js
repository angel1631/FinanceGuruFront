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
import {useCommunication} from "../../Core/hooks/useCommunication";
import SimpleTour from "../../Core/scripts/tour";
import joyride, {Callbackprops, STATUS, Step} from "react-joyride"
import Joyride from "react-joyride";

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
  /*console.log("------recargo main");
  const router = useRouter();
  if(server_props.error?.http_code ==401) router.push("/login");
  if(server_props?.error?.http_code==403) return(<Error txt={"El usuario no tiene acceso al recurso"}/>);
  */
  
  /*let resumen = useState(server_props.resumen?server_props.resumen.map(r=>({...r,movimientos:[]})):[]);
  let total_resumen = useState(server_props.total_resumen);
  */

  const tour_state = useState({
    run: true,
    steps: [
      {
        content: <h2> Hola! Bienvenido a Finance Guru</h2>,
        locale: {skip: <strong aria-lebel="skip">OMITIR</strong>},
        placement: 'center', 
        target: "body"
      },
      {
        content: <h2> Reportemos nuestro primer gasto</h2>,
        placement: 'left', 
        target: "#add_move_button",
      },
      {
        content: <h2> Selecciona que gasto quieres reportar</h2>,
        placement: 'bottom', 
        target: "#tags_container"
      },
      {
        content: <h2> Cuanto dinero gastaste</h2>,
        placement: 'bottom', 
        target: "#amount",
      },
      {
        content: <h2> En que fecha lo realizaste</h2>,
        placement: 'bottom', 
        target: "#fecha",
      },
      {
        content: <h2> Puedes detallar el gasto por ejemplo: Compre chocolates y pan</h2>,
        placement: 'bottom', 
        target: "#description",
      },
      {
        content: <h2> Ahora guardaremos el gasto</h2>,
        placement: 'bottom', 
        target: "#save_move",
      },
      {
        content: <h2> Aqui podras ver la grafica de los gastos realizados en el mes</h2>,
        placement: 'left', 
        target: "#grafica_resumen",
      },
      {
        content: <h2> Aqui podras ver cada uno de los gastos reportados y su detalle</h2>,
        placement: 'bottom', 
        target: "#resumen_gastos",
      },
    ]
  }); 
  let resumen = useState([]);
  let loading = useState(true);
  let is_ready = useState(false);
  let total_resumen = useState(0);
  let now = new Date();
  let start_date = new Date(now.getFullYear(), now.getMonth(), 1);
  let end_date = new Date(now.getFullYear(), now.getMonth()+1,0);
  let fechas = useState({start: start_date.getFullYear()+"-"+(("0" + (start_date.getMonth() + 1)).slice(-2))+"-"+(("0" + start_date.getDate()).slice(-2)) , 
      end: end_date.getFullYear()+"-"+(("0" + (end_date.getMonth() + 1)).slice(-2))+"-"+(("0" + end_date.getDate()).slice(-2)) });
  let show_form_movimientos = useState(false);
  let show_fechas = useState(false);
  let selected_date = useState('current');
  let selected_view = useState('tag');
  const months = ['Jan', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec']; 
  let add_move_initial_props = useState({});
  let grafic_type = useState('pie');
  async function preload_add_move_page(){
    try{
      let [accounts, classifications, tags, account_scheme, classification_scheme, tag_scheme, resumen] = await Promise.all([
        
        communication({url:`/api/FinanceGuru/Services/user_accounts`}),
        communication({url:`/api/FinanceGuru/Services/user_classifications`}),
        communication({url:`/api/FinanceGuru/Services/user_tags?expense=si`}),
        communication({url:`/api/FinanceGuru/FGCuenta/scheme`}),
        communication({url:`/api/FinanceGuru/FGClassification/scheme`}),
        communication({url:`/api/FinanceGuru/FGTag/scheme`}),
        get_resumen()
      ]);
      add_move_initial_props[1]({
        accounts, classifications, tags, account_scheme, classification_scheme, tag_scheme
      });
    }catch(err){
      console.log("999999999999errror", err.message);
      console.log("nnnnnnnnvalor token", (err.message+"").toLowerCase().indexOf("token"));
      if((err.message+"").toLowerCase().indexOf("token")>=0){
        console.log("88888888888888 error, token no valido");
      }else{
        errorAlert(`Ocurrio un error al cargar la pagina comunicate con el administrador (main)`);
      }
      
    }finally{
      loading[1](false);
    }
    
    
  }  
  
  function grafica(){
    let div_grafica_resumen = document.getElementById('grafica_resumen');
    
    if(div_grafica_resumen){
      let grafica_div =  echarts.init(div_grafica_resumen);
      grafica_div.clear();
      let options = {};
      if(grafic_type[0]=='pie'){
        options = {
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
      }else if(grafic_type[0]=='line'){
        options = {
          xAxis: {
              type: 'category',
              data: resumen[0].map(r=>(r.title))
          },
              yAxis: {
              type: 'value'
          },
          series: [
            {
              data: resumen[0].map(r=>r.balance),
              type: 'line',
              smooth: true
            }
          ]
        };
      }
      
      grafica_div.setOption(options);
    }
    
  }
  useEffect(()=>{
    
    grafica();
  },[resumen]);
  useEffect(()=>{
    preload_add_move_page();
    is_ready[1](true);
    // Uso:
    
  },[])
  useEffect(()=>{
    if(is_ready[0]){
      //activamos el tour
      const steps = [
        {element: '#add_move_button', text: 'Bienvenido a Finance Guru, Aqui podras llevar el control de tus gastos.' },
        {element: '#add_move_button', text: 'Iniciemos reportando nuestro primer gasto' },
        {element: '#tags_container', text: 'Ahora seleccionemos el tipo de gasto que deseas reportar'},
        {element: '#amount', text: 'Aqui colocamos cuanto se pago'},
        {element: '#fecha', text: 'Ahora coloquemos cuando se realizo el pago, por defecto colocara la fecha de hoy'},
        {element: '#description', text: 'Aqui podremos describir mas el gasto, esto ayudara a recordarnos del por que el gasto'},
        {element: '#save_move', text: 'Ahora guardemos el gasto'},
        {element: '#grafica_resumen', text: 'Aqui se mostrara un resumen de los gastos reportados'},
        {element: '#date_menu', text: 'Aqui podemos filtrar el rango de fechas que queremos ver, por defecto mostrara los gastos del mes actual'},
        {element: '#resumen_gastos', text: 'Aqui podras ver el detalle de los gastos agrupados por tipo de gasto'},
        {element: '.expandir', text: 'Si le damos click al boton de expandir, mostrara un detalle de todos los gastos que se reportaron de ese tipo'}
    
    
      ];
      //window.tour = new SimpleTour(steps);

      // termina
      //window.tour.start();
      console.log("En el dom esta", document.querySelector("#add_move_button"));
    }
  },[is_ready])
  function tourNextStep(){
    window.tour.nextStep();
  }
  async function get_resumen(start='',end='', set_states = true, view){
    if(!view) view = selected_view[0];
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
    const transactions = await communication({url:`/api/FinanceGuru/Services/my_transactions`, data});
    let transaction_group = [];
    if(view=='tag'){
      transaction_group = await group_tag(transactions);
      grafic_type[1]('pie')
    }else if(view=='group'){
      transaction_group = await group_classification(transactions);
      grafic_type[1]('pie')
    }else if(view=='date'){
      transaction_group = await group_date(transactions);
      grafic_type[1]('line')
    }
    let total = 0;

    /* Me quede aqui me traigo todos los movimientos y los debo de agrupar por tag si estoy en la vista de agrupado por tag, tengo que hacer el
    agrupado por día y agrupado por clasificacion */
    console.log("1111111 resumen tags", transaction_group);
    transaction_group.map(r=>{
      total += parseFloat(r.balance);
    });
    if(set_states){
      resumen[1](transaction_group);
      total_resumen[1](total);
    }else{
      return {resumen: transaction_group, total_resumen:total}
    }
    
  }
  
  async function group_tag(transactions = []) {
    let out = {};
    transactions.map(t=>{
      let transaction = {id: t.transactionId, fecha: t.fecha, description: t.description, amount: t.amount};
      if(out[t.tagKey]){
        out[t.tagKey].balance += parseFloat(t.amount);
        out[t.tagKey].transactions.push(transaction);
      }else{
        out[t.tagKey] = {tagKey: t.tagKey, balance:parseFloat(t.amount), title: t.tag, color: t.color, icon: t.icon, transactions: [transaction]}
      }
    });
    let out_f = []
    Object.keys(out).map(ta=>{
      out_f.push(out[ta]);
    })
    return out_f;
  }
  async function group_classification(transactions=[]){
    let out = {};
    transactions.map(t=>{
      let classificationKey = t.classificationKey;
      if(!classificationKey) classificationKey = 'no_definido';
      let transaction = {id: t.transactionId, fecha: t.fecha, description: t.description, amount: t.amount};
      if(out[classificationKey]){
        out[classificationKey].balance += parseFloat(t.amount);
        out[classificationKey].transactions.push(transaction);
      }else{
        let title = t.classification;
        let color = t.classification_color;
        let icon = t.classification_icon;
        if(!title){
          title = 'Grupo no definido';
          color = '#ef476f';
          icon = 'warning_amber';
        }
        out[classificationKey] = {
          classificationKey, balance: parseFloat(t.amount), title, color, icon, transactions: [transaction]
        }
      }
    });
    let out_f = [];
    Object.keys(out).map(cl => {
      out_f.push(out[cl])
    })
    return out_f;
  }
  async function group_date(transactions=[]) {
    let out = {};
    transactions.map(t=>{
      //let fecha = t.fecha;
      let fecha = (months[parseInt((t.fecha).substring(5,7))-1]+t.fecha.substring(7,10))
      let transaction = {id: t.transactionId, fecha: t.fecha, description: t.description, amount: t.amount};
      if(out[fecha]){
        out[fecha].balance += parseFloat(t.amount);
        out[fecha].transactions.push(transaction);
      }else{
        let title = fecha;
        let color = '#ef476f';
        let icon = 'warning_amber';
        out[fecha] = {
          key:fecha, balance: parseFloat(t.amount), title, color, icon, transactions: [transaction]
        }
      }
    });
    let out_f = [];
    Object.keys(out).map(fc => {
      out_f.push(out[fc])
    })
    return out_f;
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
          return {...e,transactions:respuesta_json};
        else return e;
      });
      resumen[1](new_resumen);
      el.target.textContent = 'arrow_drop_up';
    }else{
      el.target.textContent = 'arrow_drop_down';
      let new_resumen = resumen[0].map((e)=>{
        if(e.id==id)
          return {...e,transactions:[]};
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

    function set_view(view){
      if(view=='tag'){
        selected_view[1]('tag');
      }else if(view=='group'){
        selected_view[1]('group')
      }
      get_resumen(undefined,undefined,undefined, view);
    }
    function set_today(){
      let now = new Date();
      let today_date = now.getFullYear()+"-"+(("0" + (now.getMonth() + 1)).slice(-2))+"-"+(("0" + now.getDate()).slice(-2)); 
      fechas[1]({start: today_date, end: today_date});
      selected_date[1]('today');
      get_resumen(today_date,today_date);
    }
    return (
        <div>
          {loading[0] ?
            <div className="container_loading">...loading</div>
          :
            <>
            <Joyride
              
              callback={()=>{
                
              }}
              run={tour_state[0].run}
              steps={tour_state[0].steps}
              hideCloseButton
              scrollToFirstStep
              continuous={true}
              disableOverlay={true}
              showSkipButton
              showProgress
              styles={{
                options: {
                  zIndex: 1101,
                },
              }}
            />
            {show_form_movimientos[0] && 
              <GModal show={show_form_movimientos} title={`Agregar Movimientos`} onClouse={onClouseAddMovimiento}>
                  <AddMovimiento after_save={after_save_movimiento} initial_props={add_move_initial_props}/>
              </GModal>
            }
            <GCard>
                <div className="button_add_move_container">
                <div className="view_menu" id="view_menu">
                  <div className={` ${selected_view[0]=='tag'? 'active_view': ''}`} onClick={()=>{set_view('tag');}}>
                    Etiquetas
                  </div> 

                  <div className={` ${selected_view[0]=='group'? 'active_view': ''}`} onClick={()=>{set_view('group');}}>
                    Grupos
                  </div> 
                  <div className={` ${selected_view[0]=='date'? 'active_view': ''}`} onClick={()=>{set_view('date');}}>
                    Dias
                  </div> 

                </div>
                <div id="add_move_button" className="move_add_button active_pulse" onClick={(e)=>{show_form_movimientos[1](true)}}>
                    Agregar un gasto
                </div>
                </div>

                
                <div id="grafica_resumen" className="grafica_resumen" ></div>
                <div className="total_resumen_container">
                  <label>Q. {cast_money({amount: total_resumen[0]})}</label>
                </div>
                <div className="date_menu" id="date_menu">
                  <div className={`gastos_mes_button date_menu_option ${selected_date[0]=='current'? 'active_date': ''}`} onClick={()=>{set_month('current');}}>
                    Gastos del mes
                  </div>
                  <div className={`gastos_mes_button date_menu_option ${selected_date[0]=='last'? 'active_date': ''}`} onClick={()=>{set_month('last');}}>
                    Gastos mes pasado
                  </div>
                  <div className={`gastos_mes_button date_menu_option ${selected_date[0]=='today'? 'active_date': ''}`} onClick={()=>{set_today();}}>
                    Gastos de hoy
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
            <GCard id="resumen_gastos">
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
                      {e.transactions.length>0 &&
                        <div className="detalle_resumen_tag">
                          {e.transactions.map((m,index)=>(
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
            </GCard>
            
             </>
          }
      </div>
    );
}


