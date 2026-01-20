<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MakeCallRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'content' => 'required|string',
            'dest' => 'required|string|min:10',
            'nome' => 'nullable|string'
        ];
    }
}
