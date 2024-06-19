import { useEffect, useState } from "react";
import { communication } from "../../Core/scripts/communication.js";
import { GCard } from "../../Core/components/GCard.js";
import { GModal } from "../../Core/components/GModal.js";
import { GForm } from "../../Core/components/GForm.js";
import { validate_form } from "../../Core/scripts/form.js";
import { cast_money } from "../../Core/scripts/casts.js";
import { getContrast } from "../../Core/scripts/color.js";
import { GMoney } from "../../Core/components/GMoney.js";
import { toast } from "../../Core/scripts/alerts.js";



function AddMovimiento({after_save}){
    let values = useState({});
    let show_form_account = useState(false);
    let show_form_tag = useState(false);
    let show_form_classification = useState(false);
    let account_scheme = useState({});
    let tag_scheme = useState({});
    let tag_values = useState({});
    let classification_scheme = useState({});
    let classification_values = useState({});
    let account_values = useState({});
    let accounts = useState([]);
    let tags = useState([]);
    let classifications = useState([]);
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
        get_classification_scheme();
        get_accounts();
        get_classifications();
        get_tags();
    },[]);
    async function get_accounts(){
        const data = await communication({url:`/api/FinanceGuru/Services/user_accounts`});
        if(data.length==0) show_form_account[1](true);
        accounts[1](data);
    }
    async function get_classifications(){
        const data = await communication({url:`/api/FinanceGuru/Services/user_classifications`});
        classifications[1](data);
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
    async function get_classification_scheme(){
        try{
            let scheme_json = await communication({url:`/api/FinanceGuru/FGClassification/scheme`});
            console.log("----scheme_json", scheme_json);
            classification_scheme[1](scheme_json)
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
            toast("Todo Ok");
        }catch(err){
            
            console.log(err); toast(err.message);
        }
        
    }
    
    async function save_new_tag(){
        try{
            await validate_form(tag_values[0], tag_scheme[0].fields);
            let url = '/api/FinanceGuru/FGTag/insert';
            let respuesta_json = await communication({url, data: tag_values[0]});
            tags[1]([...tags[0],{...tag_values[0],id: respuesta_json.id}]);
            show_form_tag[1](false);
            toast("Todo Ok");
            
        }catch(err){
            console.log(err); toast(err.message);
        } 
    }
    async function save_new_classification(){
        try{
            await validate_form(classification_values[0], classification_scheme[0].fields);
            let url = '/api/FinanceGuru/FGClassification/insert';
            let respuesta_json = await communication({url, data: classification_values[0]});
            classifications[1]([...classifications[0],{...classification_values[0],id: respuesta_json.id}]);
            show_form_classification[1](false);
            toast("Todo Ok");
            
        }catch(err){
            console.log(err); toast(err.message);
        } 
    }
    async function save_movimiento(){
        
        try{
            if(mov_value[0].description=='') throw 'Se debe definir una descripcion';
            if(mov_value[0].amount=='') throw {message: 'Se debe definir el monto'};
            if(mov_value[0].account=='') throw {message: 'Se debe seleccionar una cuenta'};
            if(mov_value[0].tag=='') throw {meesage: 'Se debe seleccionar una clasificacion'};
            let movimiento = {...mov_value[0], is_debit:'si'};
            if(!movimiento.classification) movimiento.classification = classifications[0][0].id; 
            let url = '/api/FinanceGuru/Services/save_movimiento';
            let respuesta_json = await communication({url, data: movimiento});
            toast(respuesta_json.message);
            after_save();
        }catch(err){
            console.log("---error al guardar",err);
            toast(err);
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

    async function select_classification(id){
        if(mov_value[0].classification!=id){
            let classification_active = document.getElementsByClassName('classification_container active');
            if(classification_active.length>0){classification_active[0].classList.remove('active')};
            document.getElementById(id).classList.add('active');
            mov_value[1](prev_value=>({...prev_value, classification: id}));
        }else{
            document.getElementById(id).classList.remove('active');
            mov_value[1](prev_value=>({...prev_value, classification: ''}));
        }
    }
    function onChange(id,value){
        mov_value[1](prev_value=>({...prev_value, [id]: value}));
    }
    return (
        <>
        {
        
            <GCard className="movimientos_container">
                <div className="buttons_container">
                        <button className="add_account button btn-add" onClick={()=>{show_form_account[1](true);}}>Agregar Cuenta</button>
                        <button className="add_tag button button btn-add" onClick={()=>{show_form_tag[1](true);}}>Agregar Tipo de Gasto</button>
                        <button className="add_classification button button btn-add" onClick={()=>{show_form_classification[1](true);}}>Agregar Clasificacion</button>
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
                        <GMoney id="amount" value={mov_value[0].amount} field={{id:"amount", description:'Monto'}} onChange={onChange} />
                        
                        <label htmlFor="amount" className="field-description">Monto</label>
                    </div>
                    <div className="gform-line">
                        <input type="date" id="fecha" value={mov_value[0].fecha} onChange={(e)=>{onChange('fecha', e.target.value)}}/> 
                    </div>
                    
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
                <button className="send button save_move" onClick={save_movimiento}>Guardar</button>
                <div className="btn_avanzadas" onClick={()=>{show_avanzadas[1](!show_avanzadas[0]);}}><i className="material-icons">{show_avanzadas[0]?"keyboard_arrow_up":"keyboard_arrow_down"}</i></div>
                {show_avanzadas[0] && 
                    <div className="classifications_container">
                        {classifications[0] && classifications[0].map((e)=>(
                            <div className="classification_container" id={e.id} onClick={()=>{select_classification(e.id)}} >
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
                        </div>
                    </div>
                </GForm>
                
            </GModal>
        }
        {show_form_tag[0] &&
            <GModal show={show_form_tag} title={`Agregar Gasto`}>
                <GForm 
                    scheme={tag_scheme[0]} 
                    values={tag_values}
                    onSubmit={save_new_tag} 
                    action={'insert'}
                    primary_action={'insert'}/>
                
            </GModal>
        }
        {show_form_classification[0] &&
            <GModal show={show_form_classification} title={`Agregar Clasificacion`}>
                <GForm 
                    scheme={classification_scheme[0]} 
                    values={classification_values}
                    onSubmit={save_new_classification} 
                    action={'insert'}
                    primary_action={'insert'}/>
                
            </GModal>
        }
        </>
    );
}

 
export {AddMovimiento}