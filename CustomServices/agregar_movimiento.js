import { useEffect, useState } from "react";
import { communication } from "../../Core/scripts/communication.js";
import { GCard } from "../../Core/components/GCard.js";
import { GModal } from "../../Core/components/GModal.js";
import { GForm } from "../../Core/components/GForm.js";
import { validate_form } from "../../Core/scripts/form.js";
import { cast_money } from "../../Core/scripts/casts.js";
import { getContrast } from "../../Core/scripts/color.js";



function AddMovimiento({after_save}){
    let values = useState({});
    let show_form_account = useState(false);
    let show_form_tag = useState(false);
    let show_form_sub_tag = useState(false);
    let account_scheme = useState({});
    let tag_scheme = useState({});
    let tag_values = useState({});
    let sub_tag_scheme = useState({});
    let sub_tag_values = useState({});
    let account_values = useState({});
    let accounts = useState([]);
    let tags = useState([]);
    let sub_tags = useState([]);
    let now = new Date();
    let day = ("0" + now.getDate()).slice(-2);
    let month = ("0" + (now.getMonth() + 1)).slice(-2);

    let today = now.getFullYear()+"-"+(month)+"-"+(day) ;
    let mov_value = useState({description:'',amount:'', account:'', tag:'', fecha:today});
    let show_avanzadas = useState(false);
    let show_first_account = useState(true);

    useEffect(()=>{
        get_account_scheme();
        get_tag_scheme();
        get_sub_tag_scheme();
        get_accounts();
        get_sub_tags();
        get_tags();
    },[]);
    async function get_accounts(){
        const data = await communication({url:`/api/FinanceGuru/Services/user_accounts`});
        if(data.length==0) show_form_account[1](true);
        accounts[1](data);
    }
    async function get_sub_tags(){
        const data = await communication({url:`/api/FinanceGuru/Services/user_sub_tags`});
        sub_tags[1](data);
    }
    async function get_tags(){
        const data = await communication({url:`/api/FinanceGuru/Services/user_tags?expense=si`});
        tags[1](data);
    }
    async function get_account_scheme(){
        try{
            let scheme_json = await communication({url:`/api/FinanceGuru/FGCuenta/scheme`});
            console.log("----scheme_json", scheme_json);
            account_scheme[1](scheme_json)
        }catch(error){
            console.log("Error en api", error);
        }
    }
    async function get_tag_scheme(){
        try{
            let scheme_json = await communication({url:`/api/FinanceGuru/FGTag/scheme`});
            console.log("----scheme_json", scheme_json);
            tag_scheme[1](scheme_json)
        }catch(error){
            console.log("Error en api", error);
        }
    }
    async function get_sub_tag_scheme(){
        try{
            let scheme_json = await communication({url:`/api/FinanceGuru/FGSubTag/scheme`});
            console.log("----scheme_json", scheme_json);
            sub_tag_scheme[1](scheme_json)
        }catch(error){
            console.log("Error en api", error);
        }
    }
    
    async function save_new_account(){
        try{
            await validate_form(account_values[0], account_scheme[0].fields);
            let url = '/api/FinanceGuru/FGCuenta/insert';
            let respuesta_json = await communication({url, data: account_values[0]});
            accounts[1]([...accounts[0],{...account_values[0],id: respuesta_json.id}]);
            show_form_account[1](false);
            alert("Todo Ok");
        }catch(err){
            alert(err);
        }
        
    }
    
    async function save_new_tag(){
        try{
            await validate_form(tag_values[0], tag_scheme[0].fields);
            let url = '/api/FinanceGuru/FGTag/insert';
            let respuesta_json = await communication({url, data: tag_values[0]});
            tags[1]([...tags[0],{...tag_values[0],id: respuesta_json.id}]);
            show_form_tag[1](false);
            alert("Todo Ok");
            
        }catch(err){
            alert(err);
        } 
    }
    async function save_new_sub_tag(){
        try{
            await validate_form(sub_tag_values[0], sub_tag_scheme[0].fields);
            let url = '/api/FinanceGuru/FGSubTag/insert';
            let respuesta_json = await communication({url, data: sub_tag_values[0]});
            sub_tags[1]([...sub_tags[0],{...sub_tag_values[0],id: respuesta_json.id}]);
            show_form_sub_tag[1](false);
            alert("Todo Ok");
            
        }catch(err){
            alert(err);
        } 
    }
    async function save_movimiento(){
        
        try{
            if(mov_value[0].description=='') throw 'Se debe definir una descripcion';
            if(mov_value[0].amount=='') throw 'Se debe definir el monto';
            if(mov_value[0].account=='') throw 'Se debe seleccionar una cuenta';
            if(mov_value[0].tag=='') throw 'Se debe seleccionar una clasificacion';
            let movimiento = {...mov_value[0], is_debit:'si'};
            if(!movimiento.sub_tag) movimiento.sub_tag = sub_tags[0][0].id; 
            let url = '/api/FinanceGuru/Services/save_movimiento';
            let respuesta_json = await communication({url, data: movimiento});
            let new_accounts = accounts[0].map((e)=>{
                if(e.id==mov_value[0].account) e.balance = e.balance - mov_value[0].amount;
                return e;
            });
            accounts[1](new_accounts);
            alert(respuesta_json.msj);
            after_save();
        }catch(err){
            alert(err);
        }
        
        
    }
    async function select_account(id){
        if(mov_value[0].account!=id){
            let account_active = document.getElementsByClassName('account_container active');
            if(account_active.length>0){account_active[0].classList.remove('active')};
            document.getElementById(id).classList.add('active');
            mov_value[1](prev_value=>({...prev_value, account: id}));
        }else{
            document.getElementById(id).classList.remove('active');
            mov_value[1](prev_value=>({...prev_value, account: ''}));
        }
    }
    async function select_tag(id){
        if(mov_value[0].tag!=id){
            let tag_active = document.getElementsByClassName('tag_container active');
            if(tag_active.length>0){tag_active[0].classList.remove('active')};
            document.getElementById(id).classList.add('active');
            mov_value[1](prev_value=>({...prev_value, tag: id}));
        }else{
            document.getElementById(id).classList.remove('active');
            mov_value[1](prev_value=>({...prev_value, tag: ''}));
        }
    }

    async function select_sub_tag(id){
        if(mov_value[0].sub_tag!=id){
            let sub_tag_active = document.getElementsByClassName('sub_tag_container active');
            if(sub_tag_active.length>0){sub_tag_active[0].classList.remove('active')};
            document.getElementById(id).classList.add('active');
            mov_value[1](prev_value=>({...prev_value, sub_tag: id}));
        }else{
            document.getElementById(id).classList.remove('active');
            mov_value[1](prev_value=>({...prev_value, sub_tag: ''}));
        }
    }
    function onChange(id,value){
        mov_value[1](prev_value=>({...prev_value, [id]: value}));
    }
    return (
        <>
        {
        
            <GCard className="movimientos-container">
                <div className="buttons_container">
                        <button className="add_account button btn-add" onClick={()=>{show_form_account[1](true);}}>Agregar Cuenta</button>
                        <button className="add_tag button button btn-add" onClick={()=>{show_form_tag[1](true);}}>Agregar Clasificacion</button>
                        <button className="add_sub_tag button button btn-add" onClick={()=>{show_form_sub_tag[1](true);}}>Agregar Sub Clasificacion</button>
                </div>
                <div className="accounts_container">
                    <div className="accounts_container_title">
                        Pagará con: 
                    </div>
                    <div className="accounts_container_options">
                        {accounts[0] && accounts[0].map((e)=>(
                            <div className="account_container" id={e.id} onClick={()=>{select_account(e.id)}} >
                                <div className="account_title">{e.title}</div>
                                <div className="account_icon"><i className="material-icons-outlined" style={{color: e.color}} >{e.icon}</i></div>
                                <div className="account_balance">Q. {cast_money({amount: e.balance})}</div>
                            </div>    
                        ))}
                    </div>
                    
                </div>
                <div className="monto_container GForm">
                    <div className="gform-line">
                        <textarea type="text" id="description" value={mov_value[0].description} onChange={(e)=>{onChange('description', e.target.value)}}/>
                        <label htmlFor="description" className="field-description">Descripcion</label>
                    </div>
                    <div className="gform-line">
                        <input type="number" id="amount" value={mov_value[0].amount} onChange={(e)=>{onChange('amount', e.target.value)}}/>
                        <label htmlFor="amount" className="field-description">Monto</label>
                    </div>
                    <div className="gform-line">
                        <input type="date" id="fecha" value={mov_value[0].fecha} onChange={(e)=>{onChange('fecha', e.target.value)}}/> 
                    </div>
                    <button className="send button" onClick={save_movimiento}>Guardar</button>
                </div>
                <h2>Seleccionar la clasificacion</h2>
                <div className="tags_container">
                    {tags[0] && tags[0].map((e)=>{
                        let contraste = getContrast(e.color, '#FFFFFF');
                        let new_style = {background: e.color};
                        if(contraste>4) new_style.color = "#FFFFFF";
                        return (
                        <div className="tag_container" style={new_style} id={e.id} onClick={()=>{select_tag(e.id)}} >
                            <div className="tag_icon"><i  className="material-icons-outlined">{e.icon}</i></div>
                            <div className="tag_title">{e.title}</div>
                        </div>    
                    )})}
                </div>
                <div className="btn_avanzadas" onClick={()=>{show_avanzadas[1](!show_avanzadas[0]);}}><i className="material-icons">{show_avanzadas[0]?"keyboard_arrow_up":"keyboard_arrow_down"}</i></div>
                {show_avanzadas[0] && 
                    <div className="sub_tags_container">
                        {sub_tags[0] && sub_tags[0].map((e)=>(
                            <div className="sub_tag_container" id={e.id} onClick={()=>{select_sub_tag(e.id)}} >
                                <div className="tag_icon"><i style={{color: e.color}} className="material-icons">{e.icon}</i></div>
                                <div className="tag_title">{e.title}</div>
                            </div>    
                        ))}
                    </div>
                }
                
            </GCard>
        }
        {show_form_account[0] &&
            <GModal show={show_form_account} title={`Agregar Cuenta`}>
                {
                    accounts[0].length==0 &&         
                    <h3>
                        Bienvenido a Finance Guru, para iniciar debes de crear tu primera cuenta
                    </h3>
                }
                <GForm 
                    scheme={account_scheme[0]} 
                    values={account_values}
                    onSubmit={save_new_account} 
                    action={'insert'}
                    primary_action={'insert'}>
                    
                    <div className="preview_container">

                        <div className="preview">
                            <div className="account_title">{account_values[0].title}</div>
                            <div className="account_icon"><i className="material-icons-outlined" style={{color: account_values[0].color}} >{account_values[0].icon}</i></div>
                            <div className="account_balance">Q. {cast_money({amount: account_values[0].balance?account_values[0].balance:0})}</div>    
                        </div>
                    </div>
                </GForm>
                
            </GModal>
        }
        {show_form_tag[0] &&
            <GModal show={show_form_tag} title={`Agregar Clasificacion`}>
                <GForm 
                    scheme={tag_scheme[0]} 
                    values={tag_values}
                    onSubmit={save_new_tag} 
                    action={'insert'}
                    primary_action={'insert'}/>
                
            </GModal>
        }
        {show_form_sub_tag[0] &&
            <GModal show={show_form_sub_tag} title={`Agregar Clasificacion`}>
                <GForm 
                    scheme={sub_tag_scheme[0]} 
                    values={sub_tag_values}
                    onSubmit={save_new_sub_tag} 
                    action={'insert'}
                    primary_action={'insert'}/>
                
            </GModal>
        }
        </>
    );
}

 
export {AddMovimiento}