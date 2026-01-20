<?php

namespace App\Traits;

use Barryvdh\DomPDF\Facade\Pdf AS PDF;

trait ExportablePdf
{
    public function exportToPdf($view, $data, $filename)
    {
        $pdf = PDF::loadView($view, $data);
        return $pdf->download($filename . '.pdf');
    }
}
