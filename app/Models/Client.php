<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;
    protected $connection = 'pgsql';


    /**
     * A tabela associada ao modelo.
     *
     * @var string
     */
    protected $table = 'clients';

    /**
     * Os atributos que são atribuíveis em massa.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'business_name',
        'federal_id',
        'email',
        'phone',
        'country',
        'state',
        'city',
        'zip_code',
    ];

    /**
     * Os atributos que devem ser convertidos para tipos nativos.
     *
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Os atributos que possuem valores padrão.
     *
     * @var array
     */
    protected $attributes = [
        'country' => 'BR',
    ];

    /**
     * Regras de validação para o modelo.
     *
     * @var array
     */
    public static $rules = [
        'name' => 'nullable|string|max:100',
        'business_name' => 'nullable|string|max:100',
        'federal_id' => 'nullable|string|max:20',
        'email' => 'nullable|email|max:100',
        'phone' => 'nullable|string|max:20',
        'country' => 'nullable|string|size:3',
        'state' => 'nullable|string|size:2',
        'city' => 'nullable|string|max:50',
        'zip_code' => 'nullable|string|max:20',
    ];

    /**
     * Mensagens de erro personalizadas para as regras de validação.
     *
     * @var array
     */
    public static $messages = [
        'name.required' => 'O nome é obrigatório',
        'name.max' => 'O nome não pode ter mais que 100 caracteres',
        'business_name.required' => 'O nome da empresa é obrigatório',
        'business_name.max' => 'O nome da empresa não pode ter mais que 100 caracteres',
        'federal_id.required' => 'O CPF/CNPJ é obrigatório',
        'federal_id.max' => 'O CPF/CNPJ não pode ter mais que 20 caracteres',
        'email.required' => 'O e-mail é obrigatório',
        'email.email' => 'Digite um e-mail válido',
        'email.max' => 'O e-mail não pode ter mais que 100 caracteres',
        'phone.required' => 'O telefone é obrigatório',
        'phone.max' => 'O telefone não pode ter mais que 20 caracteres',
        'state.required' => 'O estado é obrigatório',
        'state.size' => 'O estado deve ter 2 caracteres',
        'city.required' => 'A cidade é obrigatória',
        'city.max' => 'A cidade não pode ter mais que 50 caracteres',
        'zip_code.required' => 'O CEP é obrigatório',
        'zip_code.max' => 'O CEP não pode ter mais que 20 caracteres',
    ];

    /**
     * Relacionamento com os agentes do cliente.
     */
    // public function agents()
    // {
    //     return $this->hasMany(Agent::class);
    // }

    /**
     * Formata o federal_id (CPF/CNPJ) antes de salvar.
     *
     * @param string $value
     * @return void
     */
    public function setFederalIdAttribute($value)
    {
        $this->attributes['federal_id'] = preg_replace('/[^0-9]/', '', $value);
    }

    /**
     * Formata o telefone antes de salvar.
     *
     * @param string $value
     * @return void
     */
    public function setPhoneAttribute($value)
    {
        $this->attributes['phone'] = preg_replace('/[^0-9]/', '', $value);
    }

    /**
     * Formata o CEP antes de salvar.
     *
     * @param string $value
     * @return void
     */
    public function setZipCodeAttribute($value)
    {
        $this->attributes['zip_code'] = preg_replace('/[^0-9]/', '', $value);
    }

    /**
     * Formata o federal_id (CPF/CNPJ) para exibição.
     *
     * @return string
     */
    public function getFormattedFederalIdAttribute()
    {
        $federal_id = $this->federal_id;
        if (strlen($federal_id) === 11) {
            return preg_replace("/(\d{3})(\d{3})(\d{3})(\d{2})/", "\$1.\$2.\$3-\$4", $federal_id);
        }
        return preg_replace("/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/", "\$1.\$2.\$3/\$4-\$5", $federal_id);
    }

    /**
     * Formata o telefone para exibição.
     *
     * @return string
     */
    public function getFormattedPhoneAttribute()
    {
        $phone = $this->phone;
        if (strlen($phone) === 11) {
            return preg_replace("/(\d{2})(\d{5})(\d{4})/", "(\$1) \$2-\$3", $phone);
        }
        return preg_replace("/(\d{2})(\d{4})(\d{4})/", "(\$1) \$2-\$3", $phone);
    }

    /**
     * Formata o CEP para exibição.
     *
     * @return string
     */
    public function getFormattedZipCodeAttribute()
    {
        return preg_replace("/(\d{5})(\d{3})/", "\$1-\$2", $this->zip_code);
    }
}
