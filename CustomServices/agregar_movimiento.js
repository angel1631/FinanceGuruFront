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
    let show_first_account = useState(true);
    let tag_form_action = useState('insert');
    let tag_id = useState();
    let tag_default_values = useState({});

    let classification_form_action = useState('insert');
    let classification_id = useState();
    let classification_default_values = useState({});

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
    async function update_tag(){
        try{
            await validate_form(tag_values[0], tag_scheme[0].fields);
            let url = '/api/FinanceGuru/FGTag/update';
            let respuesta_json = await communication({url, data: tag_values[0]});
            show_form_tag[1](false);
            tags[1](tags[0].map((tag)=>{if(tag.id==tag_values[0].id)return tag_values[0]; else return tag}));
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
    async function update_classification(){
        try{
            await validate_form(classification_values[0], classification_scheme[0].fields);
            let url = '/api/FinanceGuru/FGClassification/update';
            let respuesta_json = await communication({url, data: classification_values[0]});
            show_form_classification[1](false);
            classifications[1](classifications[0].map((classification)=>{if(classification.id==classification_values[0].id)return classification_values[0]; else return classification}));
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
    async function delete_cost_center({id}){
        try{
            if(window.confirm("Esta seguro de eliminar el centro de costos, esto eliminara todos los gastos asociados a este centro de costos")){
                let response = await communication({url: "/api/FinanceGuru/FGClassification/delete", data: {id}});
                if(response.cod == 0) throw response.message
                toast("Todo Ok");
                get_classifications();
            }
        }catch(err){
            toast(err);
        }
    }
    async function delete_tag({id}){
        try{
            if(window.confirm("Esta seguro de eliminar el Tipo de gasto, esto eliminara todos los gastos asociados a este tipo de gasto")){
                let response = await communication({url: "/api/FinanceGuru/FGTag/delete", data: {id}});
                if(response.cod == 0) throw response.message
                toast("Todo Ok");
                get_tags();
            }
        }catch(err){
            toast(err);
        }
    }
    return (
        <>
        {
        
            <GCard className="movimientos_container">
               
                <div className="cost_center_container move_container">
                    <div className="container_title">
                        <div>Cual es el centro de costos? </div>
                        <div className="add_btn button btn-sm bg-add sm-circle-btn" onClick={()=>{show_form_classification[1](true);}}>
                            +
                            <div className="tooltip bg-add">Crear nuevo centro de costos</div>
                        </div>
                    </div>
                    <div className="container_options">
                        {classifications[0] && classifications[0].map((e)=>(
                            <div className="option_container">
                                <div className="classification_container option" id={e.id} onClick={()=>{select_classification(e.id)}} >
                                    <div className="tag_icon"><i style={{color: e.color}} className="material-icons">{e.icon}</i></div>
                                    <div className="tag_title">{e.title}</div>
                                </div> 
                                <div className="settings">
                                    <i className="material-icons">settings</i>
                                    <div className="tooltip">
                                        <div onClick={()=>{delete_cost_center({id: e.id})}}>Delete</div>
                                        <div onClick={()=>{
                                            show_form_classification[1](true);
                                            classification_default_values[1](e);
                                            classification_form_action[1]('update');
                                            classification_id[1](e.id);
                                        }}>Modify</div>
                                    </div>
                                </div>
                            </div>   
                        ))}
                    </div>
                    
                </div>
                <div className="accounts_container move_container">
                    <div className="container_title">
                        <div>Con que cuenta se pagará? </div>
                        <div className="add_btn button btn-sm bg-add sm-circle-btn" onClick={()=>{show_form_account[1](true);}}>
                            +
                            <div className="tooltip bg-add">Crear nueva cuenta</div>
                        </div>
                    </div>
                    <div className="container_options">
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
                
                <div className="tags_container  move_container">
                    <div className="container_title">
                        <div>Que tipo de gasto es? </div>
                        <div className="add_account button btn-sm bg-add sm-circle-btn" onClick={()=>{show_form_tag[1](true);}}>
                            +
                            <div className="tooltip bg-add">Crear nuevo tipo de gasto</div>
                        </div>
                    </div>
                    <div className="container_options">
                        {tags[0] && tags[0].map((e)=>{
                            let contraste = getContrast(e.color, '#FFFFFF');
                            let new_style = {background: e.color};
                            if(contraste>4) new_style.color = "#FFFFFF";
                            return (
                                <div className="option_container">
                                    <div className="tag_container option" style={new_style} id={e.id} onClick={()=>{select_tag(e.id)}} >
                                        <div className="tag_icon"><i  className="material-icons-outlined">{e.icon}</i></div>
                                        <div className="tag_title">{e.title}</div>
                                    </div>
                                    <div className="settings">
                                        <i className="material-icons">settings</i>
                                        <div className="tooltip">
                                            <div onClick={()=>{delete_tag({id: e.id})}}>Delete</div>
                                            <div onClick={()=>{
                                                show_form_tag[1](true);
                                                tag_default_values[1](e);
                                                tag_form_action[1]('update');
                                                tag_id[1](e.id);
                                            }}>Modify</div>
                                        </div>
                                    </div>
                                </div>
                        )})}
                    </div>
                </div>
                <button className="send button save_move" onClick={save_movimiento}>Guardar</button>
                
            </GCard>
        }
        {show_form_account[0] &&
            <GModal show={show_form_account} title={`Agregar Cuenta`}>
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
            <GModal show={show_form_tag} title={`Agregar Tipo de Gasto`}>
                <GForm 
                    scheme={tag_scheme[0]} 
                    values={tag_values}
                    onSubmit={tag_form_action[0]=='insert'?save_new_tag:update_tag} 
                    action={tag_form_action[0]}
                    primary_action={tag_form_action[0]}
                    PRIMARY_ID={tag_id[0]}
                    values_base={tag_default_values[0]}/>
            </GModal>
        }
        {show_form_classification[0] &&
            <GModal show={show_form_classification} title={`Agregar Centro de Costos`}>
                <GForm 
                    scheme={classification_scheme[0]} 
                    values={classification_values}
                    onSubmit={classification_form_action[0]=='insert'?save_new_classification:update_classification} 
                    action={classification_form_action[0]}
                    primary_action={classification_form_action[0]}
                    PRIMARY_ID={classification_id[0]}
                    values_base={classification_default_values[0]}
                    />
                
            </GModal>
        }
        </>
    );
}

 
export {AddMovimiento}