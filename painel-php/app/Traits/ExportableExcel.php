<?php

namespace App\Traits;

use Maatwebsite\Excel\Facades\Excel;

trait ExportableExcel
{
    public function exportToExcel($export, $filename)
    {
        return Excel::download($export, $filename . '.xlsx');
    }
} 
